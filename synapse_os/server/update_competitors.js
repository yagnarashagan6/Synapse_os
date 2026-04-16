const { createClient } = require("@supabase/supabase-js");
const { ApifyClient } = require("apify-client");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const apifyClient = new ApifyClient({ token: APIFY_TOKEN });

const INFLUENCERS = [
  "hapsatousy",
  "sarahtoumi",
  "najatvb",
  "asma_lamrabet",
  "melrobbins"
];

async function updateCompetitors() {
  console.log("Starting competitors update...");

  // 1. Clear existing competitors (optional, but requested to "remove all other")
  console.log("Clearing existing competitors...");
  const { error: clearError } = await supabase.from("competitors").delete().neq("name", ""); // Delete all
  if (clearError) {
    console.error("Error clearing competitors:", clearError);
  } else {
    console.log("Existing competitors cleared.");
  }

  // 2. Ingest new influencers
  for (const username of INFLUENCERS) {
    try {
      console.log(`Processing ${username}...`);
      
      // Step 1: Fetch profile info
      const profileRun = await apifyClient.actor("apify/instagram-profile-scraper").call({ usernames: [username] });
      const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
      const profileData = profileItems.length > 0 ? profileItems[0] : {};

      // Step 2: Fetch 50 posts
      const postsRun = await apifyClient.actor("apify/instagram-scraper").call({
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: "posts",
        resultsLimit: 50,
      });
      const { items: postItems } = await apifyClient.dataset(postsRun.defaultDatasetId).listItems();

      const scrapedData = {
        ...profileData,
        latestPosts: postItems,
        _source: "manual-rebrand-update",
        lastUpdated: new Date(),
      };

      const { data, error } = await supabase.from("competitors").insert([{ 
        name: username, 
        scraped_data: scrapedData,
        is_primary: false
      }]).select();

      if (error) throw error;
      console.log(`Successfully ingested ${username}`);
    } catch (err) {
      console.error(`Failed to process ${username}:`, err.message);
    }
  }

  console.log("Competitors update complete.");
}

updateCompetitors();
