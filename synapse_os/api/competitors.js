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
      const platform = req.query.platform || 'instagram';
      const tableName = platform === 'linkedin' ? 'linkedin_competitors' : 'competitors';

      const { data: competitors, error } = await supabase
        .from(tableName)
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
          } else if (name.includes('linkedin.com')) {
            console.log(`Detected LinkedIn URL: ${name}`);
            const run = await apifyClient.actor('WI0tj4Ieb5Kq458gB').call({
                targetUrls: [name],
                maxPosts: 20,
                includeQuotePosts: true,
                includeReposts: true,
                scrapeReactions: false,
                maxReactions: 0,
                scrapeComments: false,
                maxComments: 0,
            });
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

            if (items.length === 0) {
                return res.status(404).json({ error: 'No posts found. Please ensure this is a valid public LinkedIn Company or Profile URL.' });
            }

            const normalizedPosts = items.map(post => ({
                ...post,
                likesCount: post.likeCount ?? post.likes ?? post.like ?? 0,
                commentsCount: post.commentCount ?? post.comments ?? post.comment ?? 0,
                viewCount: post.viewCount ?? post.views ?? 0,
                timestamp: post.postedAt || post.publishedAt || post.timestamp || post.time || post.date,
                caption: post.text || post.commentary || post.content || post.description || '',
            }));

            const firstPost = items[0] || {};
            const authorMeta = firstPost.author || firstPost.company || {};
            const scrapedData = {
                latestPosts: normalizedPosts,
                _source: 'WI0tj4Ieb5Kq458gB',
                lastUpdated: new Date(),
                title: authorMeta.name || firstPost.companyName || firstPost.authorName || name,
                url: name,
                followersCount: authorMeta.followersCount ?? firstPost.followersCount ?? firstPost.followers ?? 0,
                postsCount: normalizedPosts.length,
            };

            const { data, error } = await supabase
                .from('linkedin_competitors')
                .insert([{ name, scraped_data: scrapedData }])
                .select();

            if (error) throw error;

            const newCompetitor = data[0];
            return res.status(201).json({
               _id: newCompetitor.id,
               name: newCompetitor.name,
               scrapedData: newCompetitor.scraped_data,
               createdAt: newCompetitor.created_at
            });
          }
        } else {
          actorId = 'apify/website-content-crawler';
          runInput = { startUrls: [{ url: name }], maxCrawlDepth: 0, maxPagesPerCrawl: 1 };
        }
      } else {
        const platformName = req.body.platform || 'instagram';

        if (platformName === 'linkedin') {
            console.log(`Detected Name: ${name} for LinkedIn. Building company URL...`);
            // Build the exact company URL — NO fallback search
            const companyUrl = `https://www.linkedin.com/company/${name.toLowerCase().replace(/\s+/g, '-')}`;
            console.log(`LinkedIn company URL: ${companyUrl}`);

            const run = await apifyClient.actor('WI0tj4Ieb5Kq458gB').call({
                targetUrls: [companyUrl],
                maxPosts: 20,
                includeQuotePosts: true,
                includeReposts: true,
                scrapeReactions: false,
                maxReactions: 0,
                scrapeComments: false,
                maxComments: 0,
            });
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

            if (items.length === 0) {
                return res.status(404).json({ error: `No posts found for "${name}". Make sure the company name matches the LinkedIn URL slug (e.g. "nike" for linkedin.com/company/nike).` });
            }

            const normalizedPosts = items.map(post => ({
                ...post,
                likesCount: post.likeCount ?? post.likes ?? post.like ?? 0,
                commentsCount: post.commentCount ?? post.comments ?? post.comment ?? 0,
                viewCount: post.viewCount ?? post.views ?? 0,
                timestamp: post.postedAt || post.publishedAt || post.timestamp || post.time || post.date,
                caption: post.text || post.commentary || post.content || post.description || '',
            }));

            const firstPost = items[0] || {};
            const authorMeta = firstPost.author || firstPost.company || {};
            const scrapedData = {
                latestPosts: normalizedPosts,
                _source: 'WI0tj4Ieb5Kq458gB',
                lastUpdated: new Date(),
                title: authorMeta.name || firstPost.companyName || firstPost.authorName || name,
                url: companyUrl,
                followersCount: authorMeta.followersCount ?? firstPost.followersCount ?? firstPost.followers ?? 0,
                postsCount: normalizedPosts.length,
            };

            const { data, error } = await supabase
                .from('linkedin_competitors')
                .insert([{ name, scraped_data: scrapedData }])
                .select();

            if (error) throw error;

            const newCompetitor = data[0];
            return res.status(201).json({
                _id: newCompetitor.id,
                name: newCompetitor.name,
                scrapedData: newCompetitor.scraped_data,
                createdAt: newCompetitor.created_at
            });
        }

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
      const platform = req.query.platform || 'instagram';
      const tableName = platform === 'linkedin' ? 'linkedin_competitors' : 'competitors';

      const { data, error } = await supabase
        .from(tableName)
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
