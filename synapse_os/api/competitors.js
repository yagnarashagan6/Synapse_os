import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';

// Force Vercel's Node File Trace (nft) to bundle this dependency
// since apify-client dynamically requires it and Vercel often misses dynamic requires
import 'proxy-agent';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET /api/competitors ──
  if (req.method === 'GET') {
    try {
      const { data: competitors, error } = await supabase
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = competitors.map(c => ({
        _id: c.mongo_id || c.id,
        id: c.id,
        name: c.name,
        scrapedData: c.scraped_data,
        createdAt: c.created_at,
      }));

      return res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return res.status(500).json({ error: 'Failed to fetch competitors' });
    }
  }

  // ── POST /api/competitors ──
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Competitor name is required' });

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

            const profileRun = await apifyClient.actor('apify/instagram-profile-scraper').call({ usernames: [username] });
            const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
            const profileData = profileItems.length > 0 ? profileItems[0] : {};

            const postsRun = await apifyClient.actor('apify/instagram-scraper').call({
              directUrls: [`https://www.instagram.com/${username}/`],
              resultsType: 'posts',
              resultsLimit: 50,
            });
            const { items: postItems } = await apifyClient.dataset(postsRun.defaultDatasetId).listItems();

            const scrapedData = {
              ...profileData,
              latestPosts: postItems,
              _source: 'apify/instagram-dual-scraper',
              lastUpdated: new Date(),
            };

            const { data, error } = await supabase
              .from('competitors')
              .insert([{ name, scraped_data: scrapedData }])
              .select();
            if (error) throw error;

            const newCompetitor = data[0];
            return res.status(201).json({
              _id: newCompetitor.id,
              name: newCompetitor.name,
              scrapedData: newCompetitor.scraped_data,
              createdAt: newCompetitor.created_at,
            });
          } else {
            actorId = 'apify/website-content-crawler';
            runInput = { startUrls: [{ url: name }], maxCrawlDepth: 0, maxPagesPerCrawl: 1 };
          }
        } else {
          actorId = 'apify/website-content-crawler';
          runInput = { startUrls: [{ url: name }], maxCrawlDepth: 0, maxPagesPerCrawl: 1 };
        }
      } else {
        console.log(`Detected Name: ${name}. Starting Dual Scrape...`);
        const profileRun = await apifyClient.actor('apify/instagram-profile-scraper').call({ usernames: [name] });
        const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
        const profileData = profileItems.length > 0 ? profileItems[0] : {};

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
          lastUpdated: new Date(),
        };

        const { data, error } = await supabase
          .from('competitors')
          .insert([{ name, scraped_data: scrapedData }])
          .select();
        if (error) throw error;

        const newCompetitor = data[0];
        return res.status(201).json({
          _id: newCompetitor.id,
          name: newCompetitor.name,
          scrapedData: newCompetitor.scraped_data,
          createdAt: newCompetitor.created_at,
        });
      }

      // Generic scrape (non-Instagram URLs)
      console.log(`Calling actor: ${actorId}`);
      const run = await apifyClient.actor(actorId).call(runInput);
      if (run.status === 'FAILED') throw new Error('Run Failed');

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      const { data, error } = await supabase
        .from('competitors')
        .insert([{
          name,
          scraped_data: items.length > 0 ? { ...items[0], _source: actorId, lastUpdated: new Date() } : {},
        }])
        .select();
      if (error) throw error;

      const newCompetitor = data[0];
      return res.status(201).json({
        _id: newCompetitor.id,
        name: newCompetitor.name,
        scrapedData: newCompetitor.scraped_data,
        createdAt: newCompetitor.created_at,
      });
    } catch (error) {
      console.error('Error in Apify scrape:', error);
      const errorMessage = error.message || JSON.stringify(error);
      return res.status(500).json({ error: 'Failed to scrape data', details: errorMessage });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
