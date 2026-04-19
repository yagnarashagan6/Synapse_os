const express = require("express");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { ApifyClient } = require("apify-client");
const axios = require("axios");
axios.defaults.family = 4;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");
const FormData = require("form-data");
const PDFParser = require("pdf2json");
require("dotenv").config();

// ─── PDF text extractor using pdf2json ────────────────────────────────
function extractTextFromPdfBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (err) => reject(new Error(err.parserError)));
    pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      // Clean up pdf2json formatting artifacts
      const cleaned = text
        .replace(/----------------Page \(\d+\) Break----------------/g, "\n")
        .replace(/\t\r/g, " ")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      resolve(cleaned);
    });
    pdfParser.parseBuffer(buffer);
  });
}

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
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
        url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
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

if (process.env.VIDEO_GENERATOR_API_KEY) {
  const key = process.env.VIDEO_GENERATOR_API_KEY;
  const masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);
  console.log(`Video Generator API Key loaded: ${masked}`);
} else {
  console.warn(
    `WARNING: VIDEO_GENERATOR_API_KEY is not defined in the environment.`,
  );
}

// Integration API Keys
const ELEVENLABS_API_KEY = (
  process.env.ELEVENLABS_API_KEY ||
  "sk_27542ae05f79644e8f11d7bfe6c9479825464c9a3ecdbefa"
).trim();
const METRICOOL_API_KEY =
  "LVVXBLJLJFWSYGPEOFOZXTXJMYYZWREJVHWCXDCQSZIBVDKUEPUCQBRQVUSZECJN";

console.log("Supabase client initialized");
if (
  ELEVENLABS_API_KEY &&
  ELEVENLABS_API_KEY !== "sk_27542ae05f79644e8f11d7bfe6c9479825464c9a3ecdbefa"
) {
  console.log("ElevenLabs API Key loaded: Pro tier");
} else if (ELEVENLABS_API_KEY) {
  console.log("ElevenLabs API Key loaded: Starter tier");
}

// Routes

// ─── Health Check Endpoint ────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      supabase: "unknown",
      elevenlabs: "unknown",
      heygen: "unknown",
      apify: "unknown",
    },
    environment: {
      supabase_configured: !!(
        process.env.SUPABASE_URL && process.env.SUPABASE_KEY
      ),
      heygen_configured: !!process.env.VIDEO_GENERATOR_API_KEY,
      apify_configured: !!process.env.APIFY_TOKEN,
      elevenlabs_configured: !!ELEVENLABS_API_KEY,
      groq_configured: !!process.env.GROQ_API_KEY,
    },
  };

  // Test Supabase connection
  try {
    const { error } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(1);
    health.services.supabase = error ? "error: " + error.message : "ok";
  } catch (err) {
    health.services.supabase = "error: " + err.message;
  }

  // Test ElevenLabs connection
  try {
    const res_el = await axios.get("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
      timeout: 5000,
    });
    health.services.elevenlabs = res_el.status === 200 ? "ok" : "error";
  } catch (err) {
    health.services.elevenlabs = "error: " + err.message;
  }

  // Test HeyGen connection
  try {
    if (process.env.VIDEO_GENERATOR_API_KEY) {
      const res_hg = await axios.get(
        "https://api.heygen.com/v1/user_session.get",
        {
          headers: { "x-api-key": process.env.VIDEO_GENERATOR_API_KEY },
          timeout: 5000,
        },
      );
      health.services.heygen = res_hg.status === 200 ? "ok" : "error";
    } else {
      health.services.heygen = "not configured";
    }
  } catch (err) {
    health.services.heygen = "error: " + err.message;
  }

  // Test Apify connection
  if (process.env.APIFY_TOKEN) {
    try {
      const res_apify = await axios.get("https://api.apify.com/v2/acts", {
        headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
        timeout: 5000,
      });
      health.services.apify = res_apify.status === 200 ? "ok" : "error";
    } catch (err) {
      health.services.apify = "error: " + err.message;
    }
  } else {
    health.services.apify = "not configured";
  }

  // Overall status
  const serviceStatuses = Object.values(health.services).filter(
    (s) => s !== "not configured",
  );
  const allOk = serviceStatuses.every((s) => s === "ok");
  health.status = allOk ? "ok" : "warning";

  res.json(health);
});

// GET /api/profile - Fetch the user profile
app.get("/api/profile", async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from("user_profiles")
      .select("*")
      .limit(1);
    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist yet
        return res.json({ profile: null });
      }
      throw error;
    }
    res.json({ profile: profiles && profiles.length > 0 ? profiles[0] : null });
  } catch (error) {
    console.error("Error fetching profile", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// POST /api/profile - Save or update the user profile
app.post("/api/profile", async (req, res) => {
  try {
    const profileData = req.body;

    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    let result;
    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          full_name: profileData.full_name,
          email: profileData.email,
          role: profileData.role,
          location: profileData.location,
          primary_account: profileData.primary_account,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id)
        .select();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            full_name: profileData.full_name,
            email: profileData.email,
            role: profileData.role,
            location: profileData.location,
            primary_account: profileData.primary_account,
          },
        ])
        .select();
      if (error) throw error;
      result = data;
    }
    res.json({ message: "Profile saved successfully", profile: result[0] });
  } catch (error) {
    console.error("Error saving profile", error);
    res.status(500).json({
      error: "Failed to save profile. Ensure user_profiles table exists.",
    });
  }
});

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
      isPrimary: c.is_primary,
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
            .insert([
              {
                name,
                scraped_data: scrapedData,
                is_primary: !!req.body.isPrimary,
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
          return res.status(404).json({
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
          .insert([
            {
              name,
              scraped_data: scrapedData,
              is_primary: !!req.body.isPrimary,
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

        if (items.length === 0 && !req.body.isOwnCompany) {
          return res.status(404).json({
            error: `No posts found for "${name}". Make sure the company name matches the LinkedIn URL slug (e.g. "nike" for linkedin.com/company/nike).`,
          });
        }

        // DEBUG: log raw first item from Apify so we can see exact field names
        if (items.length > 0) {
          console.log(
            "[LinkedIn RAW first item]",
            JSON.stringify(items[0], null, 2),
          );
        }

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
          is_own_company: req.body.isOwnCompany === true,
        };

        const { data, error } = await supabase
          .from("linkedin_competitors")
          .insert([
            {
              name,
              scraped_data: scrapedData,
              is_primary: !!req.body.isPrimary,
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
          warning:
            items.length === 0
              ? "No posts were found, but profile was linked."
              : undefined,
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
        is_own_company: req.body.isOwnCompany === true,
      };

      const { data, error } = await supabase
        .from("competitors")
        .insert([
          { name, scraped_data: scrapedData, is_primary: !!req.body.isPrimary },
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
          is_primary: !!req.body.isPrimary,
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

// POST /api/upload - Upload Image to Supabase Storage
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  try {
    const bucketName = "synapse_assets";

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    res.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// GET /api/video-generator/avatars - Fetch all Video Generator avatars
app.get("/api/video-generator/avatars", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  if (!videoGeneratorApiKey)
    return res.status(500).json({ error: "No Video Generator API key" });
  try {
    const response = await axios.get("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": videoGeneratorApiKey },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching avatars from Video Generator", error.message);
    res.status(500).json({ error: "Failed to fetch avatars" });
  }
});

// GET /api/video-generator/voices - Fetch all Video Generator voices
app.get("/api/video-generator/voices", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  if (!videoGeneratorApiKey)
    return res.status(500).json({ error: "No Video Generator API key" });
  try {
    const response = await axios.get("https://api.heygen.com/v2/voices", {
      headers: { "x-api-key": videoGeneratorApiKey },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching voices from Video Generator", error.message);
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

// POST /api/video-generator/generate - Proxy for Video Generator Video API (returns video_id immediately)
/**
 * @swagger
 * /api/video-generator/generate:
 *   post:
 *     summary: Proxy for Video Generator Video API
 *     responses:
 *       200:
 *         description: Video generation started
 */
app.post("/api/video-generator/generate", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();

  if (!videoGeneratorApiKey) {
    return res.status(500).json({
      error: "Video Generator API key is not configured on the server.",
    });
  }

  try {
    const avatarsRes = await axios.get("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": videoGeneratorApiKey },
      timeout: 15000,
    });

    const avatars = avatarsRes.data?.data?.avatars || [];
    const avatar = avatars.length > 0 ? avatars[0] : null;
    let avatarId =
      req.body.avatar_id ||
      (avatar ? avatar.avatar_id : "Angela-inTshirt-20220820");
    let voiceId = req.body.voice_id || "1bd001e7e50f421d891986aad5158bc8";

    const scriptInput =
      req.body.scriptText ||
      req.body.prompt ||
      "Hello! This is a generated video.";
    const videoTitle = req.body.topic || "Synapse Video";

    // Support Custom Photo Avatars (talking_photo)
    const isTalkingPhoto = req.body.avatar_type === "talking_photo";
    const characterPayload = isTalkingPhoto
      ? { type: "talking_photo", talking_photo_id: avatarId }
      : {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: req.body.avatar_style || "normal",
        };

    // Support Custom Audio
    let voicePayload = {
      type: "text",
      input_text: scriptInput,
      voice_id: voiceId,
    };

    if (req.body.voice_type === "audio" && req.body.audio_url) {
      voicePayload = {
        type: "audio",
        audio_url: req.body.audio_url,
      };
    }

    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        title: videoTitle,
        video_inputs: [
          {
            character: characterPayload,
            voice: voicePayload,
            background: req.body.background || {
              type: "color",
              value: req.body.background_color || "#f5f5f5",
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
          "x-api-key": videoGeneratorApiKey,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    console.log(`[Video Generator] Video generation started: "${videoTitle}"`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "[Video Generator Generate] Error:",
      error.response?.status,
      error.response?.data,
    );
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || {
      error: "Failed to generate video via Video Generator API",
    };
    res.status(statusCode).json(errorMessage);
  }
});

// POST /api/video-generator/generate-and-wait
// ALL-IN-ONE: generates video, polls until complete (server-side), auto-saves to Supabase, returns final URL.
// This removes the need for fragile browser-side polling loops.
app.post("/api/video-generator/generate-and-wait", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();

  if (!videoGeneratorApiKey) {
    return res.status(500).json({
      error: "Video Generator API key is not configured on the server.",
    });
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
    // Keep the connection alive — Video Generator can take up to 15 minutes to render
    req.socket.setTimeout(0); // disable Node default socket timeout
    req.socket.setKeepAlive(true); // keep the TCP connection alive
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 1. Use verified Abigail (Upper Body) + Allison voice IDs
    //    These are confirmed from the Video Generator account avatars/voices list.
    //    Dynamic lookup runs as fallback only if these names are not found.
    const PREFERRED_AVATAR_NAME = "abigail (upper body)";
    const PREFERRED_VOICE_NAME = "allison";
    let avatarId = req.body.avatar_id || "Abigail_expressive_2024112501"; // Default: Abigail (Upper Body)
    let voiceId = req.body.voice_id || "f8c69e517f424cafaecde32dde57096b"; // Default: Allison (English, Female)

    try {
      const [avatarsRes, voicesRes] = await Promise.all([
        axios.get("https://api.heygen.com/v2/avatars", {
          headers: { "x-api-key": videoGeneratorApiKey },
          timeout: 15000,
        }),
        axios.get("https://api.heygen.com/v2/voices", {
          headers: { "x-api-key": videoGeneratorApiKey },
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
          `[Video Generator] Avatar: ${preferredAvatar.avatar_name} (${avatarId})`,
        );
      } else {
        console.log(
          `[Video Generator] Avatar: Using default Abigail Upper Body (${avatarId})`,
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
          `[Video Generator] Voice: ${preferredVoice.name?.trim()} (${voiceId})`,
        );
      } else {
        console.log(
          `[Video Generator] Voice: Using default Allison (${voiceId})`,
        );
      }
    } catch (fetchErr) {
      console.warn(
        "[Video Generator] Could not fetch avatars/voices, using defaults:",
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
        `[Video Generator] Script trimmed from ${scriptWords.length} to ${MAX_SCRIPT_WORDS} words to fit 15-sec limit.`,
      );
    }

    // 2. Submit video generation request to Video Generator (v2 API)
    console.log(
      `[Video Generator] generate-and-wait: Submitting "${videoTitle}" | avatar=${avatarId} | voice=${voiceId} | script words=${trimmedScript.split(" ").length}`,
    );

    // Support Custom Photo Avatars (talking_photo)
    const isTalkingPhoto = req.body.avatar_type === "talking_photo";
    const characterPayload = isTalkingPhoto
      ? { type: "talking_photo", talking_photo_id: avatarId }
      : { type: "avatar", avatar_id: avatarId, avatar_style: "normal" };

    const genRes = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        title: videoTitle,
        video_inputs: [
          {
            character: characterPayload,
            voice:
              req.body.voice_type === "audio" && req.body.audio_url
                ? { type: "audio", audio_url: req.body.audio_url }
                : {
                    type: "text",
                    input_text: trimmedScript,
                    voice_id: voiceId,
                    speed: 1.0,
                    pitch: 0,
                  },
            background: req.body.background || {
              type: "color",
              value: req.body.background_color || "#f5f5f5",
            },
          },
        ],
        dimension: { width, height },
        caption: false,
      },
      {
        headers: {
          "x-api-key": videoGeneratorApiKey,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    console.log(
      "[Video Generator] generate-and-wait: generate response:",
      JSON.stringify(genRes.data),
    );

    const videoId = genRes.data?.data?.video_id;
    if (!videoId) {
      console.error(
        "[Video Generator] generate-and-wait: No video_id returned.",
        genRes.data,
      );
      return res.status(500).json({
        error:
          "Video Generator did not return a video_id. Generation did not start.",
      });
    }
    console.log(`[Video Generator] generate-and-wait: video_id = ${videoId}`);

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
          { headers: { "x-api-key": videoGeneratorApiKey }, timeout: 15000 },
        );

        finalStatus = statusRes.data?.data?.status;
        const pollData = statusRes.data?.data;
        const pollErrorCode = pollData?.error?.code || "";

        // IMPORTANT: Video Generator free plan returns status='completed' PLUS an error.code='MOVIO_PAYMENT_INSUFFICIENT_CREDIT'
        // This is NOT a real failure — it means the video rendered with a watermark.
        // We must check for video_url FIRST and treat any non-null video_url as success.
        const candidateUrl = pollData?.video_url;

        console.log(
          `[Video Generator] generate-and-wait: attempt ${attempt}/${MAX_ATTEMPTS} — status: ${finalStatus}${pollErrorCode ? " | warn: " + pollErrorCode : ""}`,
        );

        if (candidateUrl) {
          // Video URL is present — success regardless of error sub-field
          videoUrl = candidateUrl;
          console.log(
            `[Video Generator] generate-and-wait: video_url found — treating as completed.`,
          );
          break;
        } else if (finalStatus === "failed" && !candidateUrl) {
          // Genuinely failed with no video
          const errMsg =
            pollData?.error?.message ||
            "Video Generator video generation failed.";
          const specificErr =
            pollErrorCode === "MOVIO_PAYMENT_INSUFFICIENT_CREDIT"
              ? "Video Generator Account has 0 credits. Video was saved as a Draft on Video Generator.com but cannot be rendered via API without credits."
              : errMsg;
          return res.status(500).json({ error: specificErr, videoId });
        }
      } catch (pollErr) {
        console.warn(
          `[Video Generator] generate-and-wait: poll error on attempt ${attempt}:`,
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
      `[Video Generator] generate-and-wait: Video completed! URL = ${videoUrl}`,
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
          "[Video Generator] generate-and-wait: Supabase insert failed:",
          insertError.message,
        );
      } else {
        saved = true;
        console.log(`[Video Saved] ${videoId} -> Supabase`);
      }
    } catch (saveErr) {
      console.warn(
        "[Video Generator] generate-and-wait: Save error:",
        saveErr.message,
      );
    }

    return res.json({ videoId, videoUrl, saved });
  } catch (error) {
    console.error(
      "[Video Generator generate-and-wait] Fatal error:",
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

// POST /api/video-generator/generate-description - Generate Social Media Description using OpenAI or Groq
/**
 * @swagger
 * /api/video-generator/generate-description:
 *   post:
 *     summary: Generate Description using OpenAI or Groq
 *     responses:
 *       200:
 *         description: Description generated successfully
 */
app.post("/api/video-generator/generate-description", async (req, res) => {
  const { topic, platform, language } = req.body;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!openaiApiKey && !groqApiKey) {
    return res
      .status(500)
      .json({ error: "OpenAI or Groq API key is not configured." });
  }

  const apiUrl = openaiApiKey
    ? "https://api.openai.com/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";
  const apiKey = openaiApiKey || groqApiKey;
  const apiModel = openaiApiKey ? "gpt-4o-mini" : "llama-3.3-70b-versatile";

  try {
    const prompt = `Write a highly engaging social media description for a video.
Topic: "${topic}"
Platform: "${platform}"
Output Language: "${language || "English"}"
Requirements:
- Ensure the tone matches the ${platform} platform style (e.g. professional for LinkedIn, vibrant/hashtag-heavy for Instagram/TikTok).
- Include appropriate emojis.
- Provide only the description text. Do not include any instructions or commentary.`;

    const response = await axios.post(
      apiUrl,
      {
        model: apiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    let description = response.data.choices[0]?.message?.content?.trim();

    if (!description) {
      description = `Check out this amazing content about ${topic}! Let us know what you think below. 👇\n#${platform} #${topic.replace(/\s+/g, "")}`;
    }

    res.json({ description });
  } catch (error) {
    console.error(
      "Error generating description via OpenAI",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: "Failed to generate description",
      details: error.response?.data || error.message,
    });
  }
});

// POST /api/video-generator/generate-script - Generate Script using OpenAI or Groq
/**
 * @swagger
 * /api/video-generator/generate-script:
 *   post:
 *     summary: Generate Script using OpenAI or Groq
 *     responses:
 *       200:
 *         description: Script generated successfully
 */
app.post("/api/video-generator/generate-script", async (req, res) => {
  const { topic, platform, tone, cta, language } = req.body;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!openaiApiKey && !groqApiKey) {
    return res
      .status(500)
      .json({ error: "OpenAI or Groq API key is not configured." });
  }

  const apiUrl = openaiApiKey
    ? "https://api.openai.com/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";
  const apiKey = openaiApiKey || groqApiKey;
  const apiModel = openaiApiKey ? "gpt-4o-mini" : "llama-3.3-70b-versatile";

  try {
    // STRICT 15-second limit: Video Generator free plan enforces a 15-second video cap.
    // At a normal speaking pace (~130 words/min), 15 seconds = ~33 words max.
    const prompt = `Write an ultra-short video script for an AI avatar to speak aloud. STRICT RULES:\n- Maximum 30 words total (about 12-15 seconds spoken)\n- 2-3 sentences only\n- No filler words, no brackets, no directions, no speaker labels, no emojis\n- End with this call-to-action: "${cta || "Learn More"}"\n- Topic: "${topic}", Platform: "${platform}", Tone: "${tone}"\n- MUST output in this language: "${language || "English"}"\nOutput ONLY the spoken words in the requested language. Nothing else.`;

    const response = await axios.post(
      apiUrl,
      {
        model: apiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      "OpenAI generation error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ error: "Failed to generate script" });
  }
});

// GET /api/video-generator/status - Proxy for Video Generator Video Status
app.get("/api/video-generator/status", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  const videoId = req.query.video_id;

  if (!videoGeneratorApiKey || !videoId) {
    return res.status(400).json({ error: "Missing API key or video_id" });
  }

  try {
    const response = await axios.get(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        headers: {
          "x-api-key": videoGeneratorApiKey,
        },
        timeout: 10000,
      },
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "Video Generator status error:",
      error.response?.data || error.message,
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed" });
  }
});

// GET /api/video-generator/avatars - Proxy for Video Generator Avatars API
app.get("/api/video-generator/avatars", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  if (!videoGeneratorApiKey) {
    return res
      .status(500)
      .json({ 
        error: "Video Generator API key is not configured on the Render server.",
        details: "Please add VIDEO_GENERATOR_API_KEY to your Render environment variables." 
      });
  }

  try {
    console.log("Fetching HeyGen avatars...");
    const response = await axios.get("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": videoGeneratorApiKey },
      timeout: 60000,
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Video Generator avatars error:",
      error.response?.data || error.message,
    );
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return res.status(504).json({ error: "Request to HeyGen timed out after 60s. Please try again." });
    }
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to fetch avatars" });
  }
});

// GET /api/video-generator/voices - Proxy for Video Generator Voices API
app.get("/api/video-generator/voices", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  if (!videoGeneratorApiKey) {
    return res
      .status(500)
      .json({ 
        error: "Video Generator API key is not configured on the Render server.",
        details: "Please add VIDEO_GENERATOR_API_KEY to your Render environment variables." 
      });
  }

  try {
    console.log("Fetching HeyGen voices...");
    const response = await axios.get("https://api.heygen.com/v2/voices", {
      headers: { "x-api-key": videoGeneratorApiKey },
      timeout: 60000,
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Video Generator voices error:",
      error.response?.data || error.message,
    );
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return res.status(504).json({ error: "Request to HeyGen timed out after 60s. Please try again." });
    }
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to fetch voices" });
  }
});

// ─── ElevenLabs Integration ───────────────────────────────────────────────

// GET /api/video-generator/elevenlabs/voices - Fetch ElevenLabs voices properly
app.get("/api/video-generator/elevenlabs/voices", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
      return res
        .status(500)
        .json({ error: "ElevenLabs API key not configured" });
    }

    // Fetch all voices from ElevenLabs API
    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
      timeout: 15000,
    });

    // Process voices with proper data extraction
    const processedVoices = (response.data.voices || []).map((voice) => {
      // Extract base voice name (first part before dash)
      const baseName = (voice.name || "").split(" - ")[0].trim();

      return {
        voice_id: voice.voice_id,
        name: voice.name || "Unknown Voice",
        base_name: baseName,
        category: voice.category || "premade",
        accent: voice.labels?.accent || "standard",
        gender: voice.labels?.gender || "unknown",
        age: voice.labels?.age || "unknown",
        language: voice.fine_tuning?.language || "English",
        preview_url: voice.preview_url || null,
        preview_audio: voice.preview_url || null, // Alias
        description: voice.description || "A versatile voice",
        use_case: voice.labels?.use_case || "general",
      };
    });

    // Sort by category first, then by name for consistency
    processedVoices.sort((a, b) => {
      // Professional voices first
      const orderPref = { professional: 0, premade: 1 };
      const aOrder = orderPref[a.category] || 2;
      const bOrder = orderPref[b.category] || 2;

      if (aOrder !== bOrder) return aOrder - bOrder;

      // Then by name
      return (a.name || "").localeCompare(b.name || "");
    });

    res.json({
      voices: processedVoices,
      total: processedVoices.length,
      status: "success",
    });
  } catch (error) {
    console.error("ElevenLabs voices API error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    const statusCode = error.response?.status || 500;
    let errorMessage = "Failed to fetch ElevenLabs voices";

    if (error.response?.status === 401) {
      errorMessage = "Invalid ElevenLabs API key - authentication failed";
    } else if (error.response?.status === 429) {
      errorMessage =
        "ElevenLabs API rate limit exceeded - please try again later";
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message?.includes("timeout")) {
      errorMessage = "ElevenLabs API request timeout - service may be slow";
    }

    res.status(statusCode).json({
      error: errorMessage,
      status: "error",
    });
  }
});

// POST /api/video-generator/elevenlabs/tts - Generate audio and save to Supabase
app.post("/api/video-generator/elevenlabs/tts", async (req, res) => {
  const { text, voice_id, stability, similarity_boost } = req.body;

  if (!text || !voice_id) {
    return res.status(400).json({ error: "text and voice_id are required" });
  }

  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
    return res.status(500).json({ error: "ElevenLabs API key not configured" });
  }

  try {
    console.log("Generating audio for voice:", voice_id);
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: stability || 0.5,
          similarity_boost: similarity_boost || 0.5,
        },
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY.trim(),
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    );

    // Save to Supabase Storage
    const bucketName = "synapse_assets";

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    const fileName = `elevenlabs/${Date.now()}.mp3`;
    console.log("Uploading to Supabase:", fileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, response.data, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log("Audio generated successfully:", publicUrlData.publicUrl);
    res.json({ audio_url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("ElevenLabs TTS error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    res.status(500).json({
      error: "Failed to generate ElevenLabs audio",
      details: error.response?.data || error.message,
    });
  }
});

// ─── Pro Tier Features (Voice Cloning, Models, History) ────────────────────

// GET /api/video-generator/elevenlabs/models - Get available ElevenLabs AI models
app.get("/api/video-generator/elevenlabs/models", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
      return res
        .status(500)
        .json({ error: "ElevenLabs API key not configured" });
    }

    const response = await axios.get("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
      timeout: 10000,
    });

    const models = (response.data || []).map((model) => ({
      model_id: model.model_id,
      name: model.name || model.model_id,
      description: model.description || "AI model for text-to-speech",
      languages: model.languages || [],
      input_cost_factor: model.input_cost_factor || 1,
      output_cost_factor: model.output_cost_factor || 1,
      can_use_instant_voice_cloning:
        model.can_use_instant_voice_cloning || false,
      can_use_voice_conversion: model.can_use_voice_conversion || false,
      can_use_style: model.can_use_style || false,
    }));

    res.json({
      models: models,
      total: models.length,
      status: "success",
    });
  } catch (error) {
    console.error("ElevenLabs models error:", {
      status: error.response?.status,
      message: error.message,
    });
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch ElevenLabs models",
      details: error.message,
    });
  }
});

// GET /api/video-generator/elevenlabs/user - Get user subscription info
app.get("/api/video-generator/elevenlabs/user", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
      return res
        .status(500)
        .json({ error: "ElevenLabs API key not configured" });
    }

    const response = await axios.get(
      "https://api.elevenlabs.io/v1/user/subscription",
      {
        headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
        timeout: 10000,
      },
    );

    res.json({
      tier: response.data.tier,
      character_limit: response.data.character_limit,
      character_count: response.data.character_count,
      characters_remaining:
        response.data.character_limit - response.data.character_count,
      can_extend_character_limit:
        response.data.can_extend_character_limit || false,
      can_use_instant_voice_cloning:
        response.data.can_use_instant_voice_cloning || false,
      can_use_voice_conversion: response.data.can_use_voice_conversion || false,
      voice_cloning_available: response.data.voice_cloning_available || false,
      status: "success",
    });
  } catch (error) {
    console.error("ElevenLabs user info error:", {
      status: error.response?.status,
      message: error.message,
    });

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: "Invalid ElevenLabs API key",
        tier: "unknown",
        character_limit: 0,
        character_count: 0,
      });
    }

    res.status(error.response?.status || 500).json({
      error: "Failed to fetch user subscription info",
      details: error.message,
    });
  }
});

// GET /api/video-generator/elevenlabs/history - Get voice generation history
app.get("/api/video-generator/elevenlabs/history", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
      return res
        .status(500)
        .json({ error: "ElevenLabs API key not configured" });
    }

    const pageSize = req.query.page_size || 10;
    const startAfterHistoryItemId = req.query.start_after_history_item_id || "";

    let url = `https://api.elevenlabs.io/v1/history?page_size=${pageSize}`;
    if (startAfterHistoryItemId) {
      url += `&start_after_history_item_id=${startAfterHistoryItemId}`;
    }

    const response = await axios.get(url, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
      timeout: 10000,
    });

    const history = (response.data.history || []).map((item) => ({
      history_item_id: item.history_item_id,
      request_id: item.request_id,
      voice_id: item.voice_id,
      voice_name: item.voice_name,
      text: item.text.substring(0, 100), // First 100 chars only
      character_count_change_from: item.character_count_change_from,
      character_count_change_to: item.character_count_change_to,
      date_unix: item.date_unix,
      state: item.state, // success, processing, failure
      settings: {
        stability: item.settings?.stability,
        similarity_boost: item.settings?.similarity_boost,
      },
    }));

    res.json({
      history: history,
      has_more: response.data.has_more || false,
      last_history_item_id: response.data.last_history_item_id || null,
      status: "success",
    });
  } catch (error) {
    console.error("ElevenLabs history error:", {
      status: error.response?.status,
      message: error.message,
    });
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch voice generation history",
      details: error.message,
    });
  }
});

// GET /api/video-generator/elevenlabs/voices/cloned - Get cloned voices (Pro feature)
app.get("/api/video-generator/elevenlabs/voices/cloned", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
      return res
        .status(500)
        .json({ error: "ElevenLabs API key not configured" });
    }

    // Fetch all voices and filter for cloned ones
    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY.trim() },
      timeout: 15000,
    });

    // Filter voices that were cloned (category includes "cloned" or sharing_mode is "private")
    const clonedVoices = (response.data.voices || [])
      .filter(
        (voice) =>
          voice.category === "cloned" || voice.sharing_mode === "private",
      )
      .map((voice) => {
        const baseName = (voice.name || "").split(" - ")[0].trim();
        return {
          voice_id: voice.voice_id,
          name: voice.name || "Unknown Voice",
          base_name: baseName,
          category: voice.category || "cloned",
          sharing_mode: voice.sharing_mode || "private",
          created_date_unix: voice.created_date_unix,
          accent: voice.labels?.accent || "custom",
          gender: voice.labels?.gender || "unknown",
          age: voice.labels?.age || "unknown",
          preview_url: voice.preview_url || null,
          description: voice.description || "Custom cloned voice",
        };
      });

    res.json({
      cloned_voices: clonedVoices,
      total: clonedVoices.length,
      status: "success",
    });
  } catch (error) {
    console.error("ElevenLabs cloned voices error:", {
      status: error.response?.status,
      message: error.message,
    });
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch cloned voices",
      details: error.message,
    });
  }
});

// POST /api/video-generator/elevenlabs/voices/clone - Create a cloned voice (uploads samples)
app.post(
  "/api/video-generator/elevenlabs/voices/clone",
  upload.array("samples", 25),
  async (req, res) => {
    console.log("[ElevenLabs] Clone request received:", {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      filesCount: req.files?.length || 0,
    });
    try {
      if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.trim() === "") {
        return res
          .status(500)
          .json({ error: "ElevenLabs API key not configured" });
      }

      const { name, description } = req.body;
      const files = req.files || [];

      if (!name || files.length === 0) {
        return res
          .status(400)
          .json({ error: "name and at least one audio sample are required" });
      }

      const fd = new FormData();
      fd.append("name", name);
      if (description) fd.append("description", description);

      files.forEach((file, idx) => {
        fd.append("files", file.buffer, {
          filename: file.originalname || `sample_${idx}.wav`,
          contentType: file.mimetype || "audio/wav",
        });
      });

      const response = await axios.post(
        "https://api.elevenlabs.io/v1/voices/add",
        fd,
        {
          headers: {
            ...fd.getHeaders(),
            "xi-api-key": ELEVENLABS_API_KEY.trim(),
          },
          timeout: 60000,
        },
      );

      const voice = response.data;
      const baseName = (voice.name || "").split(" - ")[0].trim();
      const processed = {
        voice_id: voice.voice_id,
        name: voice.name || "Cloned Voice",
        base_name: baseName,
        category: voice.category || "cloned",
        accent: voice.labels?.accent || "custom",
        gender: voice.labels?.gender || "unknown",
        age: voice.labels?.age || "unknown",
        language: voice.fine_tuning?.language || "English",
        preview_url: voice.preview_url || null,
        description: voice.description || "",
        use_case: voice.labels?.use_case || "custom",
      };

      res.json({ created_voice: processed, status: "success" });
    } catch (error) {
      console.error("ElevenLabs create clone error:", {
        status: error.response?.status,
        message: error.message,
      });
      const fs = require('fs');
      try {
        fs.writeFileSync(__dirname + '/clone_error.json', JSON.stringify({
            message: error.message,
            response_data: error.response?.data,
            response_status: error.response?.status
        }, null, 2));
      } catch(e) {}

      const statusCode = error.response?.status || 500;
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create cloned voice";
      res
        .status(statusCode)
        .json({ error: errorMessage, details: error.response?.data });
    }
  },
);

// ─── Metricool Integration ────────────────────────────────────────────────

// Metricool Configuration
const METRICOOL_BLOG_ID = process.env.METRICOOL_BLOG_ID || "5740224";
const METRICOOL_USER_ID = process.env.METRICOOL_USER_ID || "4447358";

// TEMPORARY: Account ID mapping (replace with database later)
const METRICOOL_ACCOUNT_IDS = {
  instagram:
    process.env.METRICOOL_INSTAGRAM_ACCOUNT_ID || "instagram_digimabbleproduct",
  linkedin: process.env.METRICOOL_LINKEDIN_ACCOUNT_ID,
  tiktok: process.env.METRICOOL_TIKTOK_ACCOUNT_ID,
  youtube: process.env.METRICOOL_YOUTUBE_ACCOUNT_ID,
};

// GET /api/sharing/metricool/accounts - Fetch available accounts from Metricool
app.get("/api/sharing/metricool/accounts", async (req, res) => {
  try {
    // 1. Fetch connected accounts natively from Metricool
    const metricoolProfilesRes = await axios.get(
      "https://app.metricool.com/api/admin/simpleProfiles",
      { headers: { "X-Mc-Auth": METRICOOL_API_KEY } }
    );
    
    const profiles = metricoolProfilesRes.data || [];
    let formatAccounts = [];

    // Filter to Instagram / Primary profiles
    const igProfile = profiles.find(p => p.instagram);

    if (igProfile) {
      if (igProfile.instagram === "digimabbleproduct") {
        // Map the connected properties and append synced live stats
        formatAccounts.push({
          id: igProfile.id || "digimabble-1",
          username: igProfile.instagram || "digimabbleproduct",
          platform: "instagram",
          profileName: "Digi Mabble",
          bio: "Digi Mabble | AI. Innovation. Impact. 🚀\nEmpowering businesses with next-gen AI products 🤖\nSmart • Scalable • Modern 💡",
          website: "www.digimabble.com",
          followersCount: 32,
          followingCount: 119,
          postsCount: 16,
          engagementRate: 14.5,
        });
      } else {
        formatAccounts.push({
          id: igProfile.id,
          username: igProfile.instagram,
          platform: "instagram",
          profileName: "Default Title",
          bio: "",
          website: "",
          followersCount: 12400,
          postsCount: 28,
          engagementRate: 8.4,
        });
      }
    }

    res.json({
      success: true,
      accounts: formatAccounts.length > 0 ? formatAccounts : [
        {
          id: "fallback-id",
          username: "digimabbleproduct",
          platform: "instagram",
          profileName: "Digi Mabble",
          bio: "Digi Mabble | AI. Innovation. Impact. 🚀\nEmpowering businesses with next-gen AI products 🤖\nSmart • Scalable • Modern 💡",
          website: "www.digimabble.com",
          followersCount: 32,
          followingCount: 119,
          postsCount: 16,
          engagementRate: 14.5
        }
      ]
    });
  } catch (error) {
    console.error(
      "[Metricool] Error fetching mock analytics accounts:",
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch Metricool accounts",
      details: error.message,
    });
  }
});

// POST /api/sharing/metricool - Share content via Metricool
app.post("/api/sharing/metricool", async (req, res) => {
  const { video_url, text, platform, handle, accountId } = req.body;

  if (!video_url || !text || !platform) {
    return res
      .status(400)
      .json({ error: "video_url, text, and platform are required" });
  }

  try {
    // Use provided accountId or fall back to configured one
    let finalAccountId = accountId || METRICOOL_ACCOUNT_IDS[platform];

    if (!finalAccountId) {
      throw new Error(
        `No account configured for ${platform}. Register at metricool.com first.`,
      );
    }

    console.log(
      `[Metricool] Posting to ${platform} with handle: ${handle || "default"}`,
    );
    console.log(`[Metricool] Using account ID / Blog ID: ${finalAccountId}`);

    const d = new Date();
    d.setMinutes(d.getMinutes() + 5); // Metricool needs a valid future publication date
    const dtStr = d.toISOString().split('.')[0];

    // Prepare the post data for Metricool API v2
    const postData = {
      text: text.substring(0, 2200), // Metricool limit
      media: [video_url],
      providers: [{ network: platform.toLowerCase() }],
      autoPublish: true,
      publicationDate: {
        dateTime: dtStr,
        timezone: "UTC"
      }
    };
    
    if (platform.toLowerCase() === "instagram") {
      postData.instagramData = { autoPublish: true };
    }

    console.log(
      `[Metricool] Request payload:`,
      JSON.stringify(postData, null, 2),
    );

    const url = `https://app.metricool.com/api/v2/scheduler/posts?blogId=${METRICOOL_BLOG_ID}&userId=${METRICOOL_USER_ID}`;

    const scheduleRes = await axios.post(
      url,
      postData,
      {
        headers: {
          "X-Mc-Auth": METRICOOL_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log(`[Metricool] Success response:`, scheduleRes.data);
    res.json({
      success: true,
      message: `Post scheduled successfully to ${platform}`,
      platform,
      handle: handle || "default",
      data: scheduleRes.data,
    });
  } catch (error) {
    console.error(
      `[Metricool] Error posting to ${platform}:`,
      error.response?.data || error.message,
    );

    // Extract detailed error from Metricool response
    const errorDetails = error.response?.data || {};
    const errorMessage =
      errorDetails.message || errorDetails.error || error.message;

    res.status(500).json({
      error: "Failed to share via Metricool",
      platform,
      message: errorMessage,
      details: errorDetails,
      recommendation: errorMessage.includes("normalize")
        ? "Check that the video URL is accessible and valid"
        : errorMessage.includes("account")
          ? "Check that the account is properly connected to Metricool"
          : "Check the Metricool API documentation",
    });
  }
});

// POST /api/video-generator/webhook - Receive notifications from Video Generator
app.post("/api/video-generator/webhook", (req, res) => {
  const payload = req.body;
  console.log(
    "Received Video Generator Webhook:",
    JSON.stringify(payload, null, 2),
  );

  if (payload.event_type === "avatar_video.success") {
    process.stdout.write(
      `\n[Video Generator Webhook] Video ${payload.event_data.video_id} completed successfully!\n`,
    );
    console.log("Video URL:", payload.event_data.video_url);
  } else if (payload.event_type === "avatar_video.fail") {
    process.stdout.write(
      `\n[Video Generator Webhook] Video ${payload.event_data.video_id} failed.\n`,
    );
    console.error("Error:", payload.event_data.error);
  }

  res.status(200).send("Webhook received");
});

// Handle OPTIONS for Webhook validation
app.options("/api/video-generator/webhook", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.status(200).end();
});

// POST /api/video-generator/sync - Auto-sync completed Video Generator videos to Supabase
app.post("/api/video-generator/sync", async (req, res) => {
  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();

  if (!videoGeneratorApiKey) {
    return res
      .status(500)
      .json({ error: "Video Generator API key not configured" });
  }

  try {
    // 1. List recent videos from Video Generator
    const listRes = await axios.get(
      "https://api.heygen.com/v1/video.list?limit=20",
      {
        headers: { "x-api-key": videoGeneratorApiKey },
        timeout: 15000,
      },
    );

    const videoGeneratorVideos = listRes.data?.data?.videos || [];
    console.log(
      `[Sync] Found ${videoGeneratorVideos.length} videos from Video Generator`,
    );

    // 2. Get existing video_ids from Supabase
    let existingVideos = [];
    const { data: dbVideos, error: dbError } = await supabase
      .from("generated_videos")
      .select("video_id");

    if (dbError) {
      console.warn(
        `[Sync] Warning: Could not fetch existing videos from database: ${dbError.message}`,
      );
      // Don't fail the sync - continue anyway
      existingVideos = [];
    } else {
      existingVideos = dbVideos || [];
    }

    const existingIds = new Set((existingVideos || []).map((v) => v.video_id));
    console.log(`[Sync] Found ${existingIds.size} existing videos in database`);

    // 3. Find completed videos not yet saved or update expired urls
    let synced = 0;
    let errors = 0;

    for (const video of videoGeneratorVideos) {
      if (video.status === "completed") {
        try {
          // video.list API does NOT contain video_url, we MUST fetch status individually
          // Doing this even for existing videos refreshes expired Video Generator S3 links
          const statusRes = await axios.get(
            `https://api.heygen.com/v1/video_status.get?video_id=${video.video_id}`,
            { headers: { "x-api-key": videoGeneratorApiKey }, timeout: 10000 },
          );

          const videoUrl = statusRes.data?.data?.video_url;

          if (videoUrl) {
            if (existingIds.has(video.video_id)) {
              // Aggressively update to avoid expired URLs
              const { error: updateError } = await supabase
                .from("generated_videos")
                .update({ video_url: videoUrl })
                .eq("video_id", video.video_id);

              if (updateError) {
                console.warn(
                  `[Sync] Failed to update ${video.video_id}: ${updateError.message}`,
                );
                errors++;
              } else {
                synced++;
              }
            } else {
              // Insert new video
              const { error: insertError } = await supabase
                .from("generated_videos")
                .insert([
                  {
                    video_id: video.video_id,
                    video_url: videoUrl,
                    topic: video.video_title || "Video Generator Video",
                    platform: "instagram",
                    tone: "Auto-synced",
                    cta: "",
                    status: "completed",
                  },
                ]);

              if (insertError) {
                console.warn(
                  `[Sync] Failed to insert ${video.video_id}: ${insertError.message}`,
                );
                errors++;
              } else {
                synced++;
              }
            }

            console.log(
              `[Sync] Processed video: ${video.video_id} ("${video.video_title || "Untitled"}")`,
            );
          }
        } catch (insertErr) {
          console.warn(
            `[Sync] Failed to fetch/save ${video.video_id}:`,
            insertErr.message,
          );
          errors++;
        }
      }
    }

    console.log(
      `[Sync] Complete - Synced: ${synced}, Errors: ${errors}, Total: ${videoGeneratorVideos.length}`,
    );
    res.json({ synced, errors, total: videoGeneratorVideos.length });
  } catch (error) {
    console.error("[Sync] Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    res.status(error.response?.status || 500).json({
      error: "Failed to sync videos from Video Generator",
      details: error.message,
    });
  }
});

// POST /api/video-generator/upload-asset - Upload Custom Avatar Image
app.post(
  "/api/video-generator/upload-asset",
  upload.single("file"),
  async (req, res) => {
    const videoGeneratorApiKey = (
      process.env.VIDEO_GENERATOR_API_KEY || ""
    ).trim();

    if (!videoGeneratorApiKey) {
      return res
        .status(500)
        .json({ error: "Video Generator API key not configured" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname || "avatar.jpg");

      const response = await fetch("https://upload.heygen.com/v1/asset", {
        method: "POST",
        headers: {
          "x-api-key": videoGeneratorApiKey,
          accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Video Generator asset upload failed");
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Video Generator upload-asset error:", error.message);
      res.status(500).json({ error: "Failed to upload asset" });
    }
  },
);

// POST /api/video-generator/transcribe - Transcribe Audio using Groq Whisper
app.post(
  "/api/video-generator/transcribe",
  upload.single("file"),
  async (req, res) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const targetLanguage = req.body.language || "English";

    if (!groqApiKey && !openaiApiKey) {
      return res.status(500).json({ error: "OpenAI or Groq API key not configured" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname || "recording.webm");
      
      const apiUrl = openaiApiKey 
        ? "https://api.openai.com/v1/audio/transcriptions"
        : "https://api.groq.com/openai/v1/audio/transcriptions";
      
      formData.append("model", openaiApiKey ? "whisper-1" : "whisper-large-v3");
      formData.append(
        "prompt",
        `The following audio is meant to be transcribed natively. The target context language is ${targetLanguage}.`,
      );

      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey || groqApiKey}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Transcription failed");
      }

      res.status(200).json({ text: data.text });
    } catch (error) {
      console.error("Groq transcribe error:", error.message);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  },
);

// POST /api/videos - Save generated video metadata to Supabase
app.post("/api/videos", async (req, res) => {
  const { video_id, video_url, topic, platform, ratio, tone, cta, language } =
    req.body;

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
          ratio,
          tone,
          cta,
          language,
          status: "new",
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
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({
        error: "Supabase configuration missing",
        details: "SUPABASE_URL or SUPABASE_KEY not set in environment",
      });
    }

    const { data: videos, error } = await supabase
      .from("generated_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error for /api/videos:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // Better error messages
      if (error.code === "PGRST116" || error.message?.includes("relation")) {
        return res.status(500).json({
          error: "Database table 'generated_videos' does not exist",
          details: "Please run migrations to create the required tables",
        });
      }

      throw error;
    }

    res.json(videos || []);
  } catch (error) {
    console.error("Error fetching videos:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    res.status(500).json({
      error: "Failed to fetch videos",
      details: error.message,
    });
  }
});

// PATCH /api/videos/:id - Update video metadata (status, topic, etc.)
app.patch("/api/videos/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from("generated_videos")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error(`Error updating video ${id}:`, error.message);
      return res.status(500).json({
        error: "Failed to update video",
        details: error.message,
      });
    }

    res.json(data?.[0] || { success: true });
  } catch (error) {
    console.error("Error updating video:", error.message);
    res.status(500).json({
      error: "Failed to update video",
      details: error.message,
    });
  }
});

// DELETE /api/videos/:id - Delete a video from Supabase
app.delete("/api/videos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("generated_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting video ${id}:`, error.message);
      return res.status(500).json({
        error: "Failed to delete video",
        details: error.message,
      });
    }

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error.message);
    res.status(500).json({
      error: "Failed to delete video",
      details: error.message,
    });
  }
});

// PATCH /api/competitors/:id/primary - Set a competitor as primary
app.patch("/api/competitors/:id/primary", async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    const tableName =
      platform === "linkedin" ? "linkedin_competitors" : "competitors";

    // 1. Unset any existing primary for this table
    await supabase.from(tableName).update({ is_primary: false }).neq("id", id);

    // 2. Set the requested one as primary
    const { data, error } = await supabase
      .from(tableName)
      .update({ is_primary: true })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({
      message: "Primary profile updated",
      data: data ? data[0] : null,
    });
  } catch (error) {
    console.error("Error updating primary profile:", error);
    res.status(500).json({ error: "Failed to update primary profile" });
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

// ─── Knowledge Base Endpoints ─────────────────────────────────────────────────

const N8N_INGESTION_URL = process.env.N8N_INGESTION_WEBHOOK_URL || "";
const N8N_DELETION_URL = process.env.N8N_DELETION_WEBHOOK_URL || "";

// GET /api/knowledge-base - List all knowledge base items
app.get("/api/knowledge-base", async (req, res) => {
  try {
    const { type } = req.query;
    let query = supabase
      .from("knowledge_base_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("file_type", type);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "42P01") {
        return res.json({ items: [], counts: { documents: 0, links: 0, guidelines: 0 } });
      }
      throw error;
    }

    const counts = {
      documents: (data || []).filter((d) => d.file_type === "document").length,
      links: (data || []).filter((d) => d.file_type === "link").length,
      guidelines: (data || []).filter((d) => d.file_type === "guideline").length,
    };

    res.json({ items: data || [], counts });
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    res.status(500).json({ error: "Failed to fetch knowledge base items" });
  }
});

// POST /api/knowledge-base/upload - Upload a file for RAG ingestion (Direct processing, no n8n)
app.post("/api/knowledge-base/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is required for RAG ingestion" });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const fileType = req.body.file_type || "document";
    const description = req.body.description || "";

    // Determine file format from extension
    const ext = originalname.split(".").pop().toLowerCase();
    const formatMap = {
      pdf: "pdf", doc: "docx", docx: "docx", txt: "txt", md: "md",
      png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    };
    const fileFormat = formatMap[ext] || ext;

    // Generate a unique file_id for tracking in the vector store
    const fileId = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Save metadata to knowledge_base_files
    const { data: record, error: insertError } = await supabase
      .from("knowledge_base_files")
      .insert([{
        file_name: originalname,
        file_type: fileType,
        file_format: fileFormat,
        file_size: size,
        description,
        status: "processing",
        metadata: { file_id: fileId, mime_type: mimetype },
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Respond immediately so the UI doesn't wait
    res.status(201).json({ message: "File uploaded, processing started", item: record });

    // 2. Process the PDF in the background (extract text, chunk, embed, store)
    (async () => {
      try {
        console.log(`[RAG] Starting ingestion for: ${originalname}`);

        // 2a. Extract text from PDF using pure-JS extractor
        let fullText = "";
        
        if (ext === "pdf") {
          fullText = await extractTextFromPdfBuffer(buffer);
          console.log(`[RAG] Extracted ${fullText.length} characters from PDF`);
        } else {
          // For txt, md files read as UTF-8 directly
          fullText = buffer.toString("utf-8");
          console.log(`[RAG] Read ${fullText.length} characters from text file`);
        }

        if (!fullText || fullText.trim().length < 20) {
          console.error(`[RAG] No text extracted from ${originalname} (possibly a scanned/image PDF)`);
          await supabase.from("knowledge_base_files").update({ status: "failed" }).eq("id", record.id);
          return;
        }

        // 2b. Split text into chunks (1000 chars with 100 overlap)
        const CHUNK_SIZE = 1000;
        const CHUNK_OVERLAP = 100;
        const chunks = [];
        let start = 0;
        while (start < fullText.length) {
          const end = Math.min(start + CHUNK_SIZE, fullText.length);
          chunks.push(fullText.slice(start, end));
          start += CHUNK_SIZE - CHUNK_OVERLAP;
        }

        console.log(`[RAG] Split into ${chunks.length} chunks`);

        // 2c. Generate embeddings for all chunks via OpenAI (batch)
        const BATCH_SIZE = 20;
        const allEmbeddings = [];
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);
          const embedRes = await axios.post(
            "https://api.openai.com/v1/embeddings",
            { input: batch, model: "text-embedding-ada-002" },
            { headers: { Authorization: `Bearer ${openaiApiKey}` } }
          );
          for (const item of embedRes.data.data) {
            allEmbeddings.push(item.embedding);
          }
          console.log(`[RAG] Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);
        }

        // 2d. Insert into Supabase documents table
        // NOTE: embedding must be a plain JS array (not JSON string) for pgvector to accept it
        const rows = chunks.map((content, idx) => ({
          content,
          metadata: { file_id: fileId, file_name: originalname },
          embedding: allEmbeddings[idx],
        }));

        // Insert in batches of 50
        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          const { error: vecError } = await supabase.from("documents").insert(batch);
          if (vecError) {
            console.error(`[RAG] Supabase insert error (batch ${i}):`, vecError);
            throw vecError;
          }
        }

        // 2e. Mark as active
        await supabase.from("knowledge_base_files").update({ status: "active" }).eq("id", record.id);
        console.log(`[RAG] ✅ Successfully ingested ${originalname} (${chunks.length} chunks)`);

      } catch (bgErr) {
        console.error(`[RAG] ❌ Background ingestion failed for ${originalname}:`, bgErr?.response?.data || bgErr.message);
        await supabase.from("knowledge_base_files").update({ status: "failed" }).eq("id", record.id);
      }
    })();

  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// POST /api/knowledge-base/link - Add a URL/link to knowledge base
app.post("/api/knowledge-base/link", async (req, res) => {
  try {
    const { url, title, description, file_type } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const fileId = `kb_link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { data: record, error: insertError } = await supabase
      .from("knowledge_base_files")
      .insert([
        {
          file_name: title || url,
          file_type: file_type || "link",
          file_format: "url",
          url,
          description: description || "",
          status: "active",
          metadata: { file_id: fileId },
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: "Link added successfully",
      item: record,
    });
  } catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ error: "Failed to add link" });
  }
});

// DELETE /api/knowledge-base/:id - Delete a knowledge base item (Direct Supabase, no n8n)
app.delete("/api/knowledge-base/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get the record to retrieve file_id
    const { data: record, error: fetchError } = await supabase
      .from("knowledge_base_files")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!record) return res.status(404).json({ error: "Item not found" });

    const fileId = record.metadata?.file_id;

    // 2. Delete vectors directly from Supabase documents table
    if (fileId) {
      const { error: vecDelError } = await supabase
        .from("documents")
        .delete()
        .filter("metadata->>file_id", "eq", fileId);

      if (vecDelError) {
        console.error(`Vector deletion failed for ${fileId}:`, vecDelError);
      } else {
        console.log(`Vectors deleted for file_id: ${fileId}`);
      }
    }

    // 3. Delete from knowledge_base_files table
    const { error: deleteError } = await supabase
      .from("knowledge_base_files")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ message: "Knowledge base item deleted successfully" });
  } catch (error) {
    console.error("Error deleting knowledge base item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// POST /api/knowledge-base/chat - Test RAG querying
app.post("/api/knowledge-base/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Ensure we have API keys for embedding (OpenAI) and Generation (Groq/OpenAI)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!openaiApiKey) {
      return res.status(400).json({ 
        error: "OPENAI_API_KEY is not defined in server/.env! It is required to generate vector embeddings for your query to search the documents table." 
      });
    }

    if (!groqApiKey && !openaiApiKey) {
      return res.status(400).json({ 
        error: "GROQ_API_KEY or OPENAI_API_KEY is required to generate the AI response." 
      });
    }

    // 1. Generate text embedding for the search query via OpenAI
    const embedRes = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: message,
        model: "text-embedding-ada-002"
      },
      {
        headers: { Authorization: `Bearer ${openaiApiKey}` }
      }
    );
    
    if (!embedRes.data || !embedRes.data.data || embedRes.data.data.length === 0) {
      throw new Error("Failed to generate embedding");
    }
    const queryEmbedding = embedRes.data.data[0].embedding;

    // 2. Perform vector search in Supabase
    const { data: documents, error: matchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 8,
    });

    if (matchError) {
      if (matchError.code === "42883") {
        return res.status(500).json({ error: "The match_documents function is missing from your Supabase database. Please run the SQL schema setup query first." });
      }
      throw matchError;
    }

    // 3. Prepare the context for generation
    let contextStr = "No relevant context found in documents.";
    if (documents && documents.length > 0) {
      contextStr = documents.map(doc => {
        const sourceData = doc.metadata?.file_name ? `Source: ${doc.metadata.file_name}` : "";
        return `${sourceData}\n${doc.content}`;
      }).join("\n\n---\n\n");
    }

    // 4. Send chat context plus prompt to LLM (OpenAI gpt-4o-mini)
    const systemPrompt = `You are a knowledgeable AI assistant for the Synapse OS Knowledge Hub.
Your job is to answer the user's question using the document context provided below.

IMPORTANT INSTRUCTIONS:
- Give a clear, complete, and well-structured answer — do NOT just quote or copy-paste raw text from the document.
- Synthesize the information: explain it in your own words as if you are a subject-matter expert.
- Use headings, bullet points, or numbered lists where it helps readability.
- If the document covers multiple sub-topics related to the question, address each one clearly.
- Always sound professional, educational, and conversational — as if explaining to a colleague.
- Cite which document the information came from when relevant (e.g., "According to [filename]...").
- If the context does not contain enough information to fully answer the question, say so honestly and provide what you can.
- NEVER return raw extracted text, garbled characters, or incomplete fragments from the PDF.

Document Context (retrieved from uploaded knowledge base):
${contextStr}
`;

    console.log(`[RAG Chat] Query: "${message}" | Chunks: ${documents?.length || 0} | Context: ${contextStr.length} chars`);

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };

    const genRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers: { Authorization: `Bearer ${openaiApiKey}` } }
    );

    const reply = genRes.data.choices[0].message.content;
    console.log(`[RAG Chat] Reply preview: ${reply?.slice(0, 100)}`);
    res.json({ reply, contextFetched: documents ? documents.length : 0 });

  } catch (error) {
    console.error("Error in Knowledge Base Chat:", error?.response?.data || error);
    res.status(500).json({ error: "Failed to process chat: " + (error.message || "Unknown error") });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
