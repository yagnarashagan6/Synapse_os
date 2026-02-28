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

if (process.env.HYGEN_API_KEY) {
    const key = process.env.HYGEN_API_KEY;
    const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    console.log(`Hygen API Key loaded: ${masked}`);
} else {
    console.warn(`WARNING: HYGEN_API_KEY is not defined in the environment.`);
}

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
        
        const mappedCompetitors = competitors.map(c => ({
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
                        id: newCompetitor.id,
                        name: newCompetitor.name,
                        scrapedData: newCompetitor.scraped_data,
                        createdAt: newCompetitor.created_at
                     });
                     return;

                } else {
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

             // 2. Get Deep Posts
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
                id: newCompetitor.id,
                name: newCompetitor.name,
                scrapedData: newCompetitor.scraped_data,
                createdAt: newCompetitor.created_at
             });
             return;
        }

        // Generic Scrape Logic (for non-Instagram URLs)
        console.log(`Calling actor: ${actorId}`);
        const run = await apifyClient.actor(actorId).call(runInput);
        
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
            id: newCompetitor.id,
            name: newCompetitor.name,
            scrapedData: newCompetitor.scraped_data,
            createdAt: newCompetitor.created_at
        });

    } catch (error) {
        console.error('Error in Apify scrape:', error);
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        res.set('Cache-Control', 'public, max-age=31536000');
        response.data.pipe(res);
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.warn(`[Proxy] Image signature expired (403): ${url.substring(0, 50)}...`);
            return res.status(403).send('Image URL signature expired');
        }
        console.error('Error proxying image:', error.message);
        res.status(500).send('Error fetching image');
    }
});

// POST /api/hygen/generate - Proxy for HeyGen Video API
app.post('/api/hygen/generate', async (req, res) => {
    const hygenApiKey = (process.env.HYGEN_API_KEY || '').trim();
    
    if (!hygenApiKey) {
        return res.status(500).json({ error: 'HeyGen API key is not configured on the server.' });
    }

    try {
        const avatarsRes = await axios.get('https://api.heygen.com/v2/avatars', {
            headers: { 'x-api-key': hygenApiKey },
            timeout: 15000,
        });
        
        const avatars = avatarsRes.data?.data?.avatars || [];
        const avatar = avatars.length > 0 ? avatars[0] : null;
        const avatarId = avatar ? avatar.avatar_id : 'Angela-inTshirt-20220820';

        const response = await axios.post(
            'https://api.heygen.com/v2/video/generate',
            {
                video_inputs: [
                    {
                        character: {
                            type: "avatar",
                            avatar_id: avatarId,
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
                    'x-api-key': hygenApiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[HeyGen Generate] Error:', error.response?.status, error.response?.data);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data || { error: 'Failed to generate video via HeyGen API' };
        res.status(statusCode).json(errorMessage);
    }
});

// GET /api/hygen/status - Proxy for HeyGen Video Status
app.get('/api/hygen/status', async (req, res) => {
    const hygenApiKey = (process.env.HYGEN_API_KEY || '').trim();
    const videoId = req.query.video_id;

    if (!hygenApiKey || !videoId) {
        return res.status(400).json({ error: 'Missing API key or video_id' });
    }

    try {
        const response = await axios.get(
            `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
            {
                headers: {
                    'x-api-key': hygenApiKey,
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

// POST /api/hygen/webhook - Receive notifications from HeyGen
app.post('/api/hygen/webhook', (req, res) => {
    const payload = req.body;
    console.log('Received HeyGen Webhook:', JSON.stringify(payload, null, 2));

    if (payload.event_type === 'avatar_video.success') {
        process.stdout.write(`\n[HeyGen Webhook] Video ${payload.event_data.video_id} completed successfully!\n`);
        console.log('Video URL:', payload.event_data.video_url);
    } else if (payload.event_type === 'avatar_video.fail') {
        process.stdout.write(`\n[HeyGen Webhook] Video ${payload.event_data.video_id} failed.\n`);
        console.error('Error:', payload.event_data.error);
    }

    res.status(200).send('Webhook received');
});

// Handle OPTIONS for Webhook validation
app.options('/api/hygen/webhook', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
    res.status(200).end();
});

// POST /api/videos - Save generated video metadata to Supabase
app.post('/api/videos', async (req, res) => {
    const { video_id, video_url, topic, platform, tone, cta } = req.body;

    if (!video_id || !video_url) {
        return res.status(400).json({ error: 'video_id and video_url are required' });
    }

    try {
        const { data, error } = await supabase
            .from('generated_videos')
            .insert([{ video_id, video_url, topic, platform, tone, cta, status: 'completed' }])
            .select();

        if (error) throw error;

        console.log(`[Video Saved] ${video_id} -> Supabase`);
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error saving video:', error);
        res.status(500).json({ error: 'Failed to save video' });
    }
});

// GET /api/videos - Fetch all generated videos
app.get('/api/videos', async (req, res) => {
    try {
        const { data: videos, error } = await supabase
            .from('generated_videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
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
