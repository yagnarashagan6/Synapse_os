const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { ApifyClient } = require("apify-client");
const axios = require("axios");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Synapse OS API",
      version: "1.0.0",
      description: "API Documentation for Synapse OS Backend",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./index.js"], // Documentation within this file
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
  const masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);
  console.log(`Hygen API Key loaded: ${masked}`);
} else {
  console.warn(`WARNING: HYGEN_API_KEY is not defined in the environment.`);
}

console.log("Supabase client initialized");

// Routes

// GET /api/competitors - Fetch all competitors
/**
 * @swagger
 * /api/competitors:
 *   get:
 *     summary: Fetch all competitors
 *     responses:
 *       200:
 *         description: List of competitors
 */
app.get("/api/competitors", async (req, res) => {
  try {
    const platform = req.query.platform || "instagram";
    const tableName =
      platform === "linkedin" ? "linkedin_competitors" : "competitors";

    const { data: competitors, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedCompetitors = competitors.map((c) => ({
      id: c.id,
      name: c.name,
      scrapedData: c.scraped_data,
      createdAt: c.created_at,
    }));

    res.json(mappedCompetitors);
  } catch (error) {
    console.error("Error fetching competitors:", error);
    res.status(500).json({ error: "Failed to fetch competitors" });
  }
});

// POST /api/competitors - Trigger Apify scrape and save result
/**
 * @swagger
 * /api/competitors:
 *   post:
 *     summary: Trigger Apify scrape and save result
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scrape triggered and saved
 */
app.post("/api/competitors", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Competitor name is required" });
  }

  try {
    console.log(`Starting scrape for: ${name}`);

    const isUrl = name.startsWith("http://") || name.startsWith("https://");
    let actorId, runInput;

    if (isUrl) {
      if (name.includes("instagram.com")) {
        const usernameMatch = name.match(/instagram\.com\/([^/?]+)/);
        if (usernameMatch) {
          const username = usernameMatch[1];
          console.log(`Detected Instagram URL. Username: ${username}`);

          // 1. Get Profile Metadata
          console.log(`Step 1: Fetching profile metadata for ${username}...`);
          const profileRun = await apifyClient
            .actor("apify/instagram-profile-scraper")
            .call({ usernames: [username] });
          const { items: profileItems } = await apifyClient
            .dataset(profileRun.defaultDatasetId)
            .listItems();
          const profileData = profileItems.length > 0 ? profileItems[0] : {};
          console.log("Profile metadata fetched.");

          // 2. Get Deep Posts
          console.log(`Step 2: Fetching 50 posts for ${username}...`);
          const postsRun = await apifyClient
            .actor("apify/instagram-scraper")
            .call({
              directUrls: [`https://www.instagram.com/${username}/`],
              resultsType: "posts",
              resultsLimit: 50,
            });
          const { items: postItems } = await apifyClient
            .dataset(postsRun.defaultDatasetId)
            .listItems();
          console.log(`Fetched ${postItems.length} posts.`);

          // Merge Data
          const scrapedData = {
            ...profileData,
            latestPosts: postItems,
            _source: "apify/instagram-dual-scraper",
            lastUpdated: new Date(),
          };

          const { data, error } = await supabase
            .from("competitors")
            .insert([{ name, scraped_data: scrapedData }])
            .select();

          if (error) throw error;

          const newCompetitor = data[0];
          res.status(201).json({
            id: newCompetitor.id,
            name: newCompetitor.name,
            scrapedData: newCompetitor.scraped_data,
            createdAt: newCompetitor.created_at,
          });
          return;
        } else {
          console.log(
            "Detected URL but could not extract username. Using website-content-crawler",
          );
          actorId = "apify/website-content-crawler";
          runInput = {
            startUrls: [{ url: name }],
            maxCrawlDepth: 0,
            maxPagesPerCrawl: 1,
          };
        }
      } else if (name.includes("linkedin.com")) {
        console.log(`Detected LinkedIn URL: ${name}`);
        const run = await apifyClient.actor("WI0tj4Ieb5Kq458gB").call({
          targetUrls: [name],
          maxPosts: 20,
          includeQuotePosts: true,
          includeReposts: true,
          scrapeReactions: false,
          maxReactions: 0,
          scrapeComments: false,
          maxComments: 0,
        });
        const { items } = await apifyClient
          .dataset(run.defaultDatasetId)
          .listItems();

        if (items.length === 0) {
          return res
            .status(404)
            .json({
              error:
                "No posts found. Please ensure this is a valid public LinkedIn Company or Profile URL.",
            });
        }

        // DEBUG: log raw first item from Apify so we can see exact field names
        console.log(
          "[LinkedIn RAW first item]",
          JSON.stringify(items[0], null, 2),
        );

        // Normalize LinkedIn items from WI0tj4Ieb5Kq458gB actor schema
        const normalizedPosts = items.map((post) => {
          // Image/preview: actor returns imgUrl string OR images array of objects with .url
          const displayUrl =
            post.imgUrl ||
            (Array.isArray(post.postImages) && post.postImages.length > 0
              ? typeof post.postImages[0] === "string"
                ? post.postImages[0]
                : post.postImages[0]?.url || post.postImages[0]?.src || null
              : null) ||
            (Array.isArray(post.images) && post.images.length > 0
              ? typeof post.images[0] === "string"
                ? post.images[0]
                : post.images[0]?.url || post.images[0]?.src || null
              : null) ||
            post.image ||
            post.thumbnail ||
            post.article?.thumbnail ||
            post.article?.image ||
            post.video?.thumbnail ||
            null;

          // Determine post type
          const postType =
            post.type ||
            (post.video || post.videoUrl
              ? "Video"
              : post.article || post.articleUrl
                ? "Article"
                : (Array.isArray(post.postImages) &&
                      post.postImages.length > 1) ||
                    (Array.isArray(post.images) && post.images.length > 1)
                  ? "Carousel"
                  : displayUrl
                    ? "Image"
                    : "Text");

          // Post URL — actor uses postUrl
          const postUrl =
            post.postUrl || post.url || post.shareUrl || post.link || "";

          // Caption / description text
          const caption =
            post.text ||
            post.commentary ||
            post.content ||
            post.description ||
            post.title ||
            "";

          // Date — actor uses postedAt (often an object { date, timestamp })
          const tsSource =
            post.postedAt ||
            post.publishedAt ||
            post.timestamp ||
            post.time ||
            post.date;
          const timestamp =
            tsSource && typeof tsSource === "object"
              ? tsSource.timestamp || tsSource.date
              : tsSource;

          // Engagement: actor uses numLikes, numComments, but WI0tj4Ieb5Kq458gB uses post.engagement.likes, etc.
          const likesCount =
            post.engagement?.likes ??
            post.numLikes ??
            post.likeCount ??
            post.likes ??
            post.like ??
            0;
          const commentsCount =
            post.engagement?.comments ??
            post.numComments ??
            post.commentCount ??
            post.comments ??
            post.comment ??
            0;

          // Views / Impressions: try many variations
          const viewCount =
            post.engagement?.views ??
            post.numImpressions ??
            post.impressionCount ??
            post.viewCount ??
            post.views ??
            post.videoViewCount ??
            post.videoPlayCount ??
            post.numPlays ??
            null;

          return {
            ...post,
            likesCount,
            commentsCount,
            viewCount,
            timestamp,
            caption,
            displayUrl,
            type: postType,
            url: postUrl,
          };
        });

        // Extract company/profile meta from first post
        const firstPost = items[0] || {};
        const authorMeta =
          firstPost.author ||
          firstPost.company ||
          firstPost.companyDetails ||
          {};
        const scrapedData = {
          latestPosts: normalizedPosts,
          _source: "WI0tj4Ieb5Kq458gB",
          lastUpdated: new Date(),
          title:
            authorMeta.name ||
            firstPost.companyName ||
            firstPost.authorName ||
            firstPost.actorName ||
            name,
          url: name,
          description:
            authorMeta.description ||
            authorMeta.tagline ||
            firstPost.companyDescription ||
            "",
          followersCount:
            (authorMeta.info && typeof authorMeta.info === "string"
              ? parseInt(authorMeta.info.replace(/\D/g, ""), 10)
              : null) ??
            authorMeta.followersCount ??
            authorMeta.followers ??
            firstPost.followersCount ??
            firstPost.followers ??
            firstPost.numFollowers ??
            0,
          postsCount: normalizedPosts.length,
        };

        const { data, error } = await supabase
          .from("linkedin_competitors")
          .insert([{ name, scraped_data: scrapedData }])
          .select();

        if (error) throw error;

        const newCompetitor = data[0];
        res.status(201).json({
          id: newCompetitor.id,
          name: newCompetitor.name,
          scrapedData: newCompetitor.scraped_data,
          createdAt: newCompetitor.created_at,
        });
        return;
      } else {
        console.log("Detected URL. Using website-content-crawler");
        actorId = "apify/website-content-crawler";
        runInput = {
          startUrls: [{ url: name }],
          maxCrawlDepth: 0,
          maxPagesPerCrawl: 1,
        };
      }
    } else {
      // Name input
      const platformName = req.body.platform || "instagram";

      if (platformName === "linkedin") {
        console.log(
          `Detected Name: ${name} for LinkedIn. Building company URL...`,
        );
        // Build the exact company URL from the name — NO fallback search
        const companyUrl = `https://www.linkedin.com/company/${name.toLowerCase().replace(/\s+/g, "-")}`;
        console.log(`LinkedIn company URL: ${companyUrl}`);

        const run = await apifyClient.actor("WI0tj4Ieb5Kq458gB").call({
          targetUrls: [companyUrl],
          maxPosts: 20,
          includeQuotePosts: true,
          includeReposts: true,
          scrapeReactions: false,
          maxReactions: 0,
          scrapeComments: false,
          maxComments: 0,
        });
        const { items } = await apifyClient
          .dataset(run.defaultDatasetId)
          .listItems();

        if (items.length === 0) {
          return res
            .status(404)
            .json({
              error: `No posts found for "${name}". Make sure the company name matches the LinkedIn URL slug (e.g. "nike" for linkedin.com/company/nike).`,
            });
        }

        // DEBUG: log raw first item from Apify so we can see exact field names
        console.log(
          "[LinkedIn RAW first item]",
          JSON.stringify(items[0], null, 2),
        );

        // Normalize LinkedIn items from WI0tj4Ieb5Kq458gB actor schema
        const normalizedPosts = items.map((post) => {
          // Image/preview: actor returns imgUrl string OR images array of objects with .url
          const displayUrl =
            post.imgUrl ||
            (Array.isArray(post.postImages) && post.postImages.length > 0
              ? typeof post.postImages[0] === "string"
                ? post.postImages[0]
                : post.postImages[0]?.url || post.postImages[0]?.src || null
              : null) ||
            (Array.isArray(post.images) && post.images.length > 0
              ? typeof post.images[0] === "string"
                ? post.images[0]
                : post.images[0]?.url || post.images[0]?.src || null
              : null) ||
            post.image ||
            post.thumbnail ||
            post.article?.thumbnail ||
            post.article?.image ||
            post.video?.thumbnail ||
            null;

          // Determine post type
          const postType =
            post.type ||
            (post.video || post.videoUrl
              ? "Video"
              : post.article || post.articleUrl
                ? "Article"
                : (Array.isArray(post.postImages) &&
                      post.postImages.length > 1) ||
                    (Array.isArray(post.images) && post.images.length > 1)
                  ? "Carousel"
                  : displayUrl
                    ? "Image"
                    : "Text");

          // Post URL — actor uses postUrl
          const postUrl =
            post.postUrl || post.url || post.shareUrl || post.link || "";

          // Caption / description text
          const caption =
            post.text ||
            post.commentary ||
            post.content ||
            post.description ||
            post.title ||
            "";

          // Date — actor uses postedAt (often an object { date, timestamp })
          const tsSource =
            post.postedAt ||
            post.publishedAt ||
            post.timestamp ||
            post.time ||
            post.date;
          const timestamp =
            tsSource && typeof tsSource === "object"
              ? tsSource.timestamp || tsSource.date
              : tsSource;

          // Engagement: actor uses numLikes, numComments, but WI0tj4Ieb5Kq458gB uses post.engagement.likes, etc.
          const likesCount =
            post.engagement?.likes ??
            post.numLikes ??
            post.likeCount ??
            post.likes ??
            post.like ??
            0;
          const commentsCount =
            post.engagement?.comments ??
            post.numComments ??
            post.commentCount ??
            post.comments ??
            post.comment ??
            0;
          const viewCount =
            post.engagement?.views ??
            post.numImpressions ??
            post.impressionCount ??
            post.viewCount ??
            post.views ??
            post.videoViewCount ??
            post.videoPlayCount ??
            post.numPlays ??
            null;

          return {
            ...post,
            likesCount,
            commentsCount,
            viewCount,
            timestamp,
            caption,
            displayUrl,
            type: postType,
            url: postUrl,
          };
        });

        // Extract company/profile meta from first post
        const firstPost = items[0] || {};
        const authorMeta =
          firstPost.author ||
          firstPost.company ||
          firstPost.companyDetails ||
          {};
        const scrapedData = {
          latestPosts: normalizedPosts,
          _source: "WI0tj4Ieb5Kq458gB",
          lastUpdated: new Date(),
          title:
            authorMeta.name ||
            firstPost.companyName ||
            firstPost.authorName ||
            firstPost.actorName ||
            name,
          url: companyUrl,
          description:
            authorMeta.description ||
            authorMeta.tagline ||
            firstPost.companyDescription ||
            "",
          followersCount:
            (authorMeta.info && typeof authorMeta.info === "string"
              ? parseInt(authorMeta.info.replace(/\D/g, ""), 10)
              : null) ??
            authorMeta.followersCount ??
            authorMeta.followers ??
            firstPost.followersCount ??
            firstPost.followers ??
            firstPost.numFollowers ??
            0,
          postsCount: normalizedPosts.length,
        };

        const { data, error } = await supabase
          .from("linkedin_competitors")
          .insert([{ name, scraped_data: scrapedData }])
          .select();

        if (error) throw error;

        const newCompetitor = data[0];
        res.status(201).json({
          id: newCompetitor.id,
          name: newCompetitor.name,
          scrapedData: newCompetitor.scraped_data,
          createdAt: newCompetitor.created_at,
        });
        return;
      }

      console.log(`Detected Name: ${name}. Starting Dual Scrape...`);

      // 1. Get Profile Metadata
      const profileRun = await apifyClient
        .actor("apify/instagram-profile-scraper")
        .call({ usernames: [name] });
      const { items: profileItems } = await apifyClient
        .dataset(profileRun.defaultDatasetId)
        .listItems();
      const profileData = profileItems.length > 0 ? profileItems[0] : {};

      // 2. Get Deep Posts
      const postsRun = await apifyClient.actor("apify/instagram-scraper").call({
        directUrls: [`https://www.instagram.com/${name}/`],
        resultsType: "posts",
        resultsLimit: 50,
      });
      const { items: postItems } = await apifyClient
        .dataset(postsRun.defaultDatasetId)
        .listItems();

      const scrapedData = {
        ...profileData,
        latestPosts: postItems,
        _source: "apify/instagram-dual-scraper",
        lastUpdated: new Date(),
      };

      const { data, error } = await supabase
        .from("competitors")
        .insert([{ name, scraped_data: scrapedData }])
        .select();

      if (error) throw error;

      const newCompetitor = data[0];
      res.status(201).json({
        id: newCompetitor.id,
        name: newCompetitor.name,
        scrapedData: newCompetitor.scraped_data,
        createdAt: newCompetitor.created_at,
      });
      return;
    }

    // Generic Scrape Logic (for non-Instagram URLs)
    console.log(`Calling actor: ${actorId}`);
    const run = await apifyClient.actor(actorId).call(runInput);

    console.log(`Scrape finished. Run ID: ${run.id}. Status: ${run.status}`);
    if (run.status === "FAILED") throw new Error("Run Failed");

    const { items } = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems();
    const platform = req.query.platform || "instagram";
    const tableName =
      platform === "linkedin" ? "linkedin_competitors" : "competitors";

    const { data, error } = await supabase
      .from(tableName)
      .insert([
        {
          name,
          scraped_data:
            items.length > 0
              ? { ...items[0], _source: actorId, lastUpdated: new Date() }
              : {},
        },
      ])
      .select();

    if (error) throw error;

    const newCompetitor = data[0];
    res.status(201).json({
      id: newCompetitor.id,
      name: newCompetitor.name,
      scrapedData: newCompetitor.scraped_data,
      createdAt: newCompetitor.created_at,
    });
  } catch (error) {
    console.error("Error in Apify scrape:", error);
    const errorMessage = error.message || JSON.stringify(error);
    res
      .status(500)
      .json({ error: "Failed to scrape data", details: errorMessage });
  }
});

// Image Proxy Endpoint
app.get("/api/proxy-image", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.set("Cache-Control", "public, max-age=31536000");
    response.data.pipe(res);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.warn(
        `[Proxy] Image signature expired (403): ${url.substring(0, 50)}...`,
      );
      return res.status(403).send("Image URL signature expired");
    }
    console.error("Error proxying image:", error.message);
    res.status(500).send("Error fetching image");
  }
});

// POST /api/hygen/generate - Proxy for HeyGen Video API (returns video_id immediately)
/**
 * @swagger
 * /api/hygen/generate:
 *   post:
 *     summary: Proxy for HeyGen Video API
 *     responses:
 *       200:
 *         description: Video generation started
 */
app.post("/api/hygen/generate", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();

  if (!hygenApiKey) {
    return res
      .status(500)
      .json({ error: "HeyGen API key is not configured on the server." });
  }

  try {
    const avatarsRes = await axios.get("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": hygenApiKey },
      timeout: 15000,
    });

    const avatars = avatarsRes.data?.data?.avatars || [];
    const avatar = avatars.length > 0 ? avatars[0] : null;
    let avatarId = req.body.avatar_id || (avatar ? avatar.avatar_id : "Angela-inTshirt-20220820");
    let voiceId = req.body.voice_id || "1bd001e7e50f421d891986aad5158bc8";

    const scriptInput =
      req.body.scriptText ||
      req.body.prompt ||
      "Hello! This is a generated video.";
    const videoTitle = req.body.topic || "Synapse Video";

    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        title: videoTitle,
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: avatarId,
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: scriptInput,
              voice_id: voiceId,
            },
            background: {
              type: "color",
              value: "#f5f5f5",
            },
          },
        ],
        dimension: {
          width: req.body.width || 1080,
          height: req.body.height || 1920,
        },
      },
      {
        headers: {
          "x-api-key": hygenApiKey,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    console.log(`[HeyGen] Video generation started: "${videoTitle}"`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "[HeyGen Generate] Error:",
      error.response?.status,
      error.response?.data,
    );
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || {
      error: "Failed to generate video via HeyGen API",
    };
    res.status(statusCode).json(errorMessage);
  }
});

// POST /api/hygen/generate-and-wait
// ALL-IN-ONE: generates video, polls until complete (server-side), auto-saves to Supabase, returns final URL.
// This removes the need for fragile browser-side polling loops.
app.post("/api/hygen/generate-and-wait", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();

  if (!hygenApiKey) {
    return res
      .status(500)
      .json({ error: "HeyGen API key is not configured on the server." });
  }

  const scriptInput =
    req.body.scriptText ||
    req.body.prompt ||
    "Hello! This is a generated video.";
  const videoTitle = req.body.topic || "Synapse Video";
  const { platform, tone, cta } = req.body;

  let width = req.body.width || 1080;
  let height = req.body.height || 1920;

  try {
    // Keep the connection alive — HeyGen can take up to 15 minutes to render
    req.socket.setTimeout(0); // disable Node default socket timeout
    req.socket.setKeepAlive(true); // keep the TCP connection alive
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 1. Use verified Abigail (Upper Body) + Allison voice IDs
    //    These are confirmed from the HeyGen account avatars/voices list.
    //    Dynamic lookup runs as fallback only if these names are not found.
    const PREFERRED_AVATAR_NAME = "abigail (upper body)";
    const PREFERRED_VOICE_NAME = "allison";
    let avatarId = req.body.avatar_id || "Abigail_expressive_2024112501"; // Default: Abigail (Upper Body)
    let voiceId = req.body.voice_id || "f8c69e517f424cafaecde32dde57096b"; // Default: Allison (English, Female)

    try {
      const [avatarsRes, voicesRes] = await Promise.all([
        axios.get("https://api.heygen.com/v2/avatars", {
          headers: { "x-api-key": hygenApiKey },
          timeout: 15000,
        }),
        axios.get("https://api.heygen.com/v2/voices", {
          headers: { "x-api-key": hygenApiKey },
          timeout: 15000,
        }),
      ]);

      // Find Abigail (Upper Body) by name
      const avatars = avatarsRes.data?.data?.avatars || [];
      const preferredAvatar =
        avatars.find(
          (a) => a.avatar_name.toLowerCase() === PREFERRED_AVATAR_NAME,
        ) ||
        avatars.find((a) => a.avatar_name.toLowerCase().includes("abigail"));
      if (preferredAvatar) {
        avatarId = preferredAvatar.avatar_id;
        console.log(
          `[HeyGen] Avatar: ${preferredAvatar.avatar_name} (${avatarId})`,
        );
      } else {
        console.log(
          `[HeyGen] Avatar: Using default Abigail Upper Body (${avatarId})`,
        );
      }

      // Find Allison voice by name
      const voices =
        voicesRes.data?.data?.voices || voicesRes.data?.voices || [];
      const preferredVoice =
        voices.find(
          (v) => (v.name || "").toLowerCase().trim() === PREFERRED_VOICE_NAME,
        ) ||
        voices.find((v) => (v.name || "").toLowerCase().includes("allison"));
      if (preferredVoice) {
        voiceId = preferredVoice.voice_id;
        console.log(
          `[HeyGen] Voice: ${preferredVoice.name?.trim()} (${voiceId})`,
        );
      } else {
        console.log(`[HeyGen] Voice: Using default Allison (${voiceId})`);
      }
    } catch (fetchErr) {
      console.warn(
        "[HeyGen] Could not fetch avatars/voices, using defaults:",
        fetchErr.message,
      );
    }

    // Trim script to prevent exceeding 15-second limit (~35 words max spoken at normal pace)
    const MAX_SCRIPT_WORDS = 35;
    const scriptWords = scriptInput.trim().split(/\s+/);
    const trimmedScript =
      scriptWords.length > MAX_SCRIPT_WORDS
        ? scriptWords.slice(0, MAX_SCRIPT_WORDS).join(" ") + "."
        : scriptInput.trim();
    if (scriptWords.length > MAX_SCRIPT_WORDS) {
      console.warn(
        `[HeyGen] Script trimmed from ${scriptWords.length} to ${MAX_SCRIPT_WORDS} words to fit 15-sec limit.`,
      );
    }

    // 2. Submit video generation request to HeyGen (v2 API)
    console.log(
      `[HeyGen] generate-and-wait: Submitting "${videoTitle}" | avatar=${avatarId} | voice=${voiceId} | script words=${trimmedScript.split(" ").length}`,
    );
    const genRes = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        title: videoTitle,
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: avatarId,
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: trimmedScript,
              voice_id: voiceId,
              speed: 1.0,
              pitch: 0,
            },
            background: {
              type: "color",
              value: "#f5f5f5",
            },
          },
        ],
        dimension: { width, height },
        caption: false,
      },
      {
        headers: {
          "x-api-key": hygenApiKey,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    console.log(
      "[HeyGen] generate-and-wait: generate response:",
      JSON.stringify(genRes.data),
    );

    const videoId = genRes.data?.data?.video_id;
    if (!videoId) {
      console.error(
        "[HeyGen] generate-and-wait: No video_id returned.",
        genRes.data,
      );
      return res
        .status(500)
        .json({
          error: "HeyGen did not return a video_id. Generation did not start.",
        });
    }
    console.log(`[HeyGen] generate-and-wait: video_id = ${videoId}`);

    // 3. Server-side polling loop (5s intervals, up to 180 attempts = 15 min)
    const MAX_ATTEMPTS = 180;
    const POLL_INTERVAL_MS = 5000;
    let videoUrl = null;
    let finalStatus = "pending";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      try {
        const statusRes = await axios.get(
          `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
          { headers: { "x-api-key": hygenApiKey }, timeout: 15000 },
        );

        finalStatus = statusRes.data?.data?.status;
        const pollData = statusRes.data?.data;
        const pollErrorCode = pollData?.error?.code || "";

        // IMPORTANT: HeyGen free plan returns status='completed' PLUS an error.code='MOVIO_PAYMENT_INSUFFICIENT_CREDIT'
        // This is NOT a real failure — it means the video rendered with a watermark.
        // We must check for video_url FIRST and treat any non-null video_url as success.
        const candidateUrl = pollData?.video_url;

        console.log(
          `[HeyGen] generate-and-wait: attempt ${attempt}/${MAX_ATTEMPTS} — status: ${finalStatus}${pollErrorCode ? " | warn: " + pollErrorCode : ""}`,
        );

        if (candidateUrl) {
          // Video URL is present — success regardless of error sub-field
          videoUrl = candidateUrl;
          console.log(
            `[HeyGen] generate-and-wait: video_url found — treating as completed.`,
          );
          break;
        } else if (finalStatus === "failed" && !candidateUrl) {
          // Genuinely failed with no video
          const errMsg =
            pollData?.error?.message || "HeyGen video generation failed.";
          const specificErr =
            pollErrorCode === "MOVIO_PAYMENT_INSUFFICIENT_CREDIT"
              ? "HeyGen Account has 0 credits. Video was saved as a Draft on HeyGen.com but cannot be rendered via API without credits."
              : errMsg;
          return res.status(500).json({ error: specificErr, videoId });
        }
      } catch (pollErr) {
        console.warn(
          `[HeyGen] generate-and-wait: poll error on attempt ${attempt}:`,
          pollErr.message,
        );
        // Continue polling even on transient errors
      }
    }

    if (!videoUrl) {
      return res.status(408).json({
        error:
          "Video generation timed out after 15 minutes. The video_id has been returned so you can fetch it manually.",
        videoId,
      });
    }

    console.log(
      `[HeyGen] generate-and-wait: Video completed! URL = ${videoUrl}`,
    );

    // 4. Auto-save to Supabase
    let saved = false;
    try {
      const { error: insertError } = await supabase
        .from("generated_videos")
        .insert([
          {
            video_id: videoId,
            video_url: videoUrl,
            topic: videoTitle,
            platform: platform || "Unknown",
            tone: tone || "Unknown",
            cta: cta || "",
            status: "completed",
          },
        ]);
      if (insertError) {
        console.warn(
          "[HeyGen] generate-and-wait: Supabase insert failed:",
          insertError.message,
        );
      } else {
        saved = true;
        console.log(`[Video Saved] ${videoId} -> Supabase`);
      }
    } catch (saveErr) {
      console.warn("[HeyGen] generate-and-wait: Save error:", saveErr.message);
    }

    return res.json({ videoId, videoUrl, saved });
  } catch (error) {
    console.error(
      "[HeyGen generate-and-wait] Fatal error:",
      error.response?.status,
      error.response?.data || error.message,
    );
    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to generate video";
    return res.status(statusCode).json({ error: errorMessage });
  }
});

// POST /api/hygen/generate-script - Generate Script using Groq
/**
 * @swagger
 * /api/hygen/generate-script:
 *   post:
 *     summary: Generate Script using Groq
 *     responses:
 *       200:
 *         description: Script generated successfully
 */
app.post("/api/hygen/generate-script", async (req, res) => {
  const { topic, platform, tone, cta } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ error: "Groq API key is not configured." });
  }

  try {
    // STRICT 15-second limit: HeyGen free plan enforces a 15-second video cap.
    // At a normal speaking pace (~130 words/min), 15 seconds = ~33 words max.
    const prompt = `Write an ultra-short video script for an AI avatar to speak aloud. STRICT RULES:\n- Maximum 30 words total (about 12-15 seconds spoken)\n- 2-3 sentences only\n- No filler words, no brackets, no directions, no speaker labels, no emojis\n- End with this call-to-action: "${cta || "Learn More"}"\n- Topic: "${topic}", Platform: "${platform}", Tone: "${tone}"\nOutput ONLY the spoken words. Nothing else.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    let scriptText = response.data.choices[0]?.message?.content?.trim();

    // Fallback if empty
    if (!scriptText) {
      scriptText = `Welcome! Today we are talking about ${topic}. This is essential for anyone looking to stay ahead in ${platform}. ${cta || "Learn more"}.`;
    }

    return res.status(200).json({ script: scriptText });
  } catch (error) {
    console.error(
      "Groq generation error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ error: "Failed to generate script" });
  }
});

// GET /api/hygen/status - Proxy for HeyGen Video Status
app.get("/api/hygen/status", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();
  const videoId = req.query.video_id;

  if (!hygenApiKey || !videoId) {
    return res.status(400).json({ error: "Missing API key or video_id" });
  }

  try {
    const response = await axios.get(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        headers: {
          "x-api-key": hygenApiKey,
        },
        timeout: 10000,
      },
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "HeyGen status error:",
      error.response?.data || error.message,
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed" });
  }
});

// GET /api/hygen/avatars - Proxy for HeyGen Avatars API
app.get("/api/hygen/avatars", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();
  if (!hygenApiKey) {
    return res.status(500).json({ error: "HeyGen API key is not configured." });
  }

  try {
    const response = await axios.get("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": hygenApiKey },
      timeout: 30000,
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "HeyGen avatars error:",
      error.response?.data || error.message,
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to fetch avatars" });
  }
});

// GET /api/hygen/voices - Proxy for HeyGen Voices API
app.get("/api/hygen/voices", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();
  if (!hygenApiKey) {
    return res.status(500).json({ error: "HeyGen API key is not configured." });
  }

  try {
    const response = await axios.get("https://api.heygen.com/v2/voices", {
      headers: { "x-api-key": hygenApiKey },
      timeout: 30000,
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "HeyGen voices error:",
      error.response?.data || error.message,
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to fetch voices" });
  }
});

// POST /api/hygen/webhook - Receive notifications from HeyGen
app.post("/api/hygen/webhook", (req, res) => {
  const payload = req.body;
  console.log("Received HeyGen Webhook:", JSON.stringify(payload, null, 2));

  if (payload.event_type === "avatar_video.success") {
    process.stdout.write(
      `\n[HeyGen Webhook] Video ${payload.event_data.video_id} completed successfully!\n`,
    );
    console.log("Video URL:", payload.event_data.video_url);
  } else if (payload.event_type === "avatar_video.fail") {
    process.stdout.write(
      `\n[HeyGen Webhook] Video ${payload.event_data.video_id} failed.\n`,
    );
    console.error("Error:", payload.event_data.error);
  }

  res.status(200).send("Webhook received");
});

// Handle OPTIONS for Webhook validation
app.options("/api/hygen/webhook", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.status(200).end();
});

// POST /api/hygen/sync - Auto-sync completed HeyGen videos to Supabase
app.post("/api/hygen/sync", async (req, res) => {
  const hygenApiKey = (process.env.HYGEN_API_KEY || "").trim();

  if (!hygenApiKey) {
    return res.status(500).json({ error: "HeyGen API key not configured" });
  }

  try {
    // 1. List recent videos from HeyGen
    const listRes = await axios.get(
      "https://api.heygen.com/v1/video.list?limit=20",
      {
        headers: { "x-api-key": hygenApiKey },
        timeout: 15000,
      },
    );

    const heygenVideos = listRes.data?.data?.videos || [];

    // 2. Get existing video_ids from Supabase
    const { data: existingVideos, error: dbError } = await supabase
      .from("generated_videos")
      .select("video_id");

    if (dbError) throw dbError;

    const existingIds = new Set((existingVideos || []).map((v) => v.video_id));

    // 3. Find completed videos not yet saved
    let synced = 0;
    for (const video of heygenVideos) {
      if (video.status === "completed" && !existingIds.has(video.video_id)) {
        try {
          // video.list API does NOT contain video_url, we MUST fetch status individually
          const statusRes = await axios.get(
            `https://api.heygen.com/v1/video_status.get?video_id=${video.video_id}`,
            { headers: { "x-api-key": hygenApiKey }, timeout: 10000 },
          );

          const videoUrl = statusRes.data?.data?.video_url;

          if (videoUrl) {
            await supabase.from("generated_videos").insert([
              {
                video_id: video.video_id,
                video_url: videoUrl,
                topic: video.video_title || "HeyGen Video",
                platform: "Auto-synced",
                tone: "Auto-synced",
                cta: "",
                status: "completed",
              },
            ]);
            synced++;
            console.log(
              `[Sync] Saved video: ${video.video_id} ("${video.video_title || "Untitled"}")`,
            );
          }
        } catch (insertErr) {
          console.warn(
            `[Sync] Failed to fetch/save ${video.video_id}:`,
            insertErr.message,
          );
        }
      }
    }

    console.log(`[Sync] Synced ${synced} new videos from HeyGen`);
    res.json({ synced, total: heygenVideos.length });
  } catch (error) {
    console.error("[Sync] Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to sync videos from HeyGen",
      details: error.response?.data || error.message,
    });
  }
});

// POST /api/videos - Save generated video metadata to Supabase
app.post("/api/videos", async (req, res) => {
  const { video_id, video_url, topic, platform, tone, cta } = req.body;

  if (!video_id || !video_url) {
    return res
      .status(400)
      .json({ error: "video_id and video_url are required" });
  }

  try {
    const { data, error } = await supabase
      .from("generated_videos")
      .insert([
        {
          video_id,
          video_url,
          topic,
          platform,
          tone,
          cta,
          status: "completed",
        },
      ])
      .select();

    if (error) throw error;

    console.log(`[Video Saved] ${video_id} -> Supabase`);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error saving video:", error);
    res.status(500).json({ error: "Failed to save video" });
  }
});

// GET /api/videos - Fetch all generated videos
app.get("/api/videos", async (req, res) => {
  try {
    const { data: videos, error } = await supabase
      .from("generated_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// DELETE /api/competitors/:id - Delete a competitor
app.delete("/api/competitors/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Competitor ID is required" });
  }
  const platform = req.query.platform || "instagram";
  const tableName =
    platform === "linkedin" ? "linkedin_competitors" : "competitors";

  try {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Competitor deleted successfully" });
  } catch (error) {
    console.error("Error deleting competitor:", error);
    res.status(500).json({ error: "Failed to delete competitor" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
