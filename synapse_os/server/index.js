const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { ApifyClient } = require('apify-client');
const axios = require('axios');
require('dotenv').config();

// Fix for Node.js undici / fetch IPv6 timeout issues in localhost
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const apifyClient = new ApifyClient({
    token: APIFY_TOKEN,
});

// Verify API Keys on Startup (useful for debugging, avoid logging full secret)
if (process.env.HYGEN_API_KEY) {
    const key = process.env.HYGEN_API_KEY;
    const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    console.log(`Hygen API Key loaded: ${masked}`);
    console.log(`No other API keys are required for Hygen.`);
} else {
    console.warn(`WARNING: HYGEN_API_KEY is not defined in the environment.`);
}


// Connect to MongoDB (Removed)
// Supabase connection is stateless (REST/HTTP) so no explicit connect call needed here.
console.log('Supabase client initialized');

// Routes

// GET /api/competitors - Fetch all competitors
app.get('/api/competitors', async (req, res) => {
    try {
        const { data: competitors, error } = await supabase
            .from('competitors')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Map back to camelCase if frontend expects it, or keep snake_case.
        // The previous model used `scrapedData` and `createdAt`.
        // Supabase returns `scraped_data` and `created_at`.
        // Let's map it to match existing frontend expectations to minimize frontend breakage.
        const mappedCompetitors = competitors.map(c => ({
            _id: c.mongo_id || c.id, // Use mongo_id if present (migrated), else UUID. Frontend likely uses _id.
            id: c.id,
            name: c.name,
            scrapedData: c.scraped_data,
            createdAt: c.created_at
        }));

        res.json(mappedCompetitors);
    } catch (error) {
        console.error('Error fetching competitors:', error);
        res.status(500).json({ error: 'Failed to fetch competitors' });
    }
});

// POST /api/competitors - Trigger Apify scrape and save result
app.post('/api/competitors', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Competitor name is required' });
    }

    try {
        console.log(`Starting scrape for: ${name}`);
        
        // Determine if input is a URL or a name
        const isUrl = name.startsWith('http://') || name.startsWith('https://');
        let actorId, runInput;

        if (isUrl) {
            if (name.includes('instagram.com')) {
                const usernameMatch = name.match(/instagram\.com\/([^/?]+)/);
                if (usernameMatch) {
                    const username = usernameMatch[1];
                     console.log(`Detected Instagram URL. Username: ${username}`);
                     
                     // 1. Get Profile Metadata
                     console.log(`Step 1: Fetching profile metadata for ${username}...`);
                     const profileRun = await apifyClient.actor('apify/instagram-profile-scraper').call({ usernames: [username] });
                     const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
                     const profileData = profileItems.length > 0 ? profileItems[0] : {};
                     console.log('Profile metadata fetched.');

                     // 2. Get Deep Posts
                     console.log(`Step 2: Fetching 50 posts for ${username}...`);
                     const postsRun = await apifyClient.actor('apify/instagram-scraper').call({
                         directUrls: [`https://www.instagram.com/${username}/`],
                         resultsType: 'posts',
                         resultsLimit: 50,
                     });
                     const { items: postItems } = await apifyClient.dataset(postsRun.defaultDatasetId).listItems();
                     console.log(`Fetched ${postItems.length} posts.`);

                     // Merge Data
                     const scrapedData = {
                         ...profileData,
                         latestPosts: postItems, // Overwrite with deep list
                         _source: 'apify/instagram-dual-scraper',
                         lastUpdated: new Date()
                     };

                     const { data, error } = await supabase
                        .from('competitors')
                        .insert([
                            { name, scraped_data: scrapedData }
                        ])
                        .select();
                     
                     if (error) throw error;

                     const newCompetitor = data[0];
                    // Map for response match
                     res.status(201).json({
                        _id: newCompetitor.id,
                        name: newCompetitor.name,
                        scrapedData: newCompetitor.scraped_data,
                        createdAt: newCompetitor.created_at
                     });
                     return;

                } else {
                     // Fallback
                     console.log('Detected URL but could not extract username. Using website-content-crawler');
                     actorId = 'apify/website-content-crawler';
                     runInput = { startUrls: [{ url: name }], maxCrawlDepth: 0, maxPagesPerCrawl: 1 };
                }
            } else {
                console.log('Detected URL. Using website-content-crawler');
                actorId = 'apify/website-content-crawler';
                runInput = { startUrls: [{ url: name }], maxCrawlDepth: 0, maxPagesPerCrawl: 1 };
            }
        } else {
             // Name input
             console.log(`Detected Name: ${name}. Starting Dual Scrape...`);
             
             // 1. Get Profile Metadata
             const profileRun = await apifyClient.actor('apify/instagram-profile-scraper').call({ usernames: [name] });
             const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
             const profileData = profileItems.length > 0 ? profileItems[0] : {};

             // 2. Get Deep Posts (Construct URL from name)
             const postsRun = await apifyClient.actor('apify/instagram-scraper').call({
                 directUrls: [`https://www.instagram.com/${name}/`],
                 resultsType: 'posts',
                 resultsLimit: 50,
             });
             const { items: postItems } = await apifyClient.dataset(postsRun.defaultDatasetId).listItems();

             const scrapedData = {
                 ...profileData,
                 latestPosts: postItems,
                 _source: 'apify/instagram-dual-scraper',
                 lastUpdated: new Date()
             };

             const { data, error } = await supabase
                .from('competitors')
                .insert([
                    { name, scraped_data: scrapedData }
                ])
                .select();
             
             if (error) throw error;

             const newCompetitor = data[0];
             res.status(201).json({
                _id: newCompetitor.id,
                name: newCompetitor.name,
                scrapedData: newCompetitor.scraped_data,
                createdAt: newCompetitor.created_at
             });
             return;
        }

        // Generic Scrape Logic (for non-Instagram URLs)
        console.log(`Calling actor: ${actorId}`);
        const run = await apifyClient.actor(actorId).call(runInput);
        
        // ... rest of generic logic ...
        // Note: The above dual-scraper returns early, so we need to restructure to avoid unreachable code
        // or ensure generic logic is only reachable if not returned.
        
        // Refactoring to ensure clean flow:
        // Since I put return statements in the dual-scrape blocks, I need to make sure 
        // the generic logic below is wrapped in an else or handle appropriately.
        
        // Actually, let's simplify. 
        // If it was handled above, we returned. If we are here, it's generic.
        
        console.log(`Scrape finished. Run ID: ${run.id}. Status: ${run.status}`);
        if (run.status === 'FAILED') throw new Error('Run Failed');

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        const { data, error } = await supabase
            .from('competitors')
            .insert([
                { 
                    name, 
                    scraped_data: items.length > 0 ? { ...items[0], _source: actorId, lastUpdated: new Date() } : {}
                }
            ])
            .select();

        if (error) throw error;

        const newCompetitor = data[0];
        res.status(201).json({
            _id: newCompetitor.id,
            name: newCompetitor.name,
            scrapedData: newCompetitor.scraped_data,
            createdAt: newCompetitor.created_at
        });

    } catch (error) {
        console.error('Error in Apify scrape:', error);
        // Ensure error message is stringified if it's an object
        const errorMessage = error.message || JSON.stringify(error);
        res.status(500).json({ error: 'Failed to scrape data', details: errorMessage });
    }
});

// Image Proxy Endpoint
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                // Mimic a browser request to avoid some blocking
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // 'Referer': 'https://www.instagram.com/' // Sometimes referrer blocking is strict, sometimes needed. Let's try without first as axios default.
                 // Actually, instagram often blocks if referrer is wrong or missing. Let's spoof it.
                'Referer': 'https://www.instagram.com/'
            }
        });

        // Set appropriate content type
        res.set('Content-Type', response.headers['content-type']);
        // Cache control to improve performance
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Pipe the image data to the response
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying image:', error.message);
         // If generic axios error, send 500
        res.status(500).send('Error fetching image');
    }
});

// POST /api/hygen/generate - Proxy for HeyGen Video API
app.post('/api/hygen/generate', async (req, res) => {
    const hygenApiKey = process.env.HYGEN_API_KEY;
    
    if (!hygenApiKey) {
        return res.status(500).json({ error: 'HeyGen API key is not configured on the server.' });
    }

    try {
        // We use a predefined avatar and voice, and pass the user prompt as input text.
        const response = await axios.post(
            'https://api.heygen.com/v2/video/generate',
            {
                video_inputs: [
                    {
                        character: {
                            type: "avatar",
                            avatar_id: "Angela-inTshirt-20220820",
                            avatar_style: "normal"
                        },
                        voice: {
                            type: "text",
                            input_text: req.body.prompt || "Hello! This is a generated video.",
                            voice_id: "1bd001e7e50f421d891986aad5158bc8"
                        }
                    }
                ],
                dimension: {
                    width: 1080,
                    height: 1920
                }
            },
            {
                headers: {
                    'X-Api-Key': hygenApiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('HeyGen proxy error:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data || { error: 'Failed to generate video via HeyGen API' };
        res.status(statusCode).json(errorMessage);
    }
});

// GET /api/hygen/status - Proxy for HeyGen Video Status
app.get('/api/hygen/status', async (req, res) => {
    const hygenApiKey = process.env.HYGEN_API_KEY;
    const videoId = req.query.video_id;

    if (!hygenApiKey || !videoId) {
        return res.status(400).json({ error: 'Missing API key or video_id' });
    }

    try {
        const response = await axios.get(
            `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
            {
                headers: {
                    'X-Api-Key': hygenApiKey,
                },
                timeout: 10000,
            }
        );
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('HeyGen status error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed' });
    }
});
// DELETE /api/competitors/:id - Delete a competitor
app.delete('/api/competitors/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Competitor ID is required' });
    }
    try {
        const { error } = await supabase.from('competitors').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Competitor deleted successfully' });
    } catch (error) {
        console.error('Error deleting competitor:', error);
        res.status(500).json({ error: 'Failed to delete competitor' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
