const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data: competitors, error } = await supabase
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    if (competitors.length === 0) {
        console.log("No competitors found.");
        return;
    }

    const scraped = competitors[0].scraped_data;
    if (!scraped || !scraped.latestPosts || scraped.latestPosts.length === 0) {
        console.log("No posts found in the latest competitor.");
        return;
    }

    let url = scraped.latestPosts[0].displayUrl;
    // let's try the second post if the first doesn't have displayUrl
    if (!url && scraped.latestPosts.length > 1) {
        url = scraped.latestPosts[1].displayUrl;
    }
    
    console.log("Found Image URL:", url);

    if (!url) return;

    // Test 1: No Referer
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
        });
        console.log("Success with no Referer, status:", response.status, "Length:", response.data.length);
    } catch (e) {
        console.error("No Referer Failed:", e.response ? e.response.status : e.message);
    }

    // Test 2: Current Proxy Headers (Mobile UA + Referer)
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.instagram.com/'
            }
        });
        console.log("Success with Mobile UA + Referer, status:", response.status);
    } catch (e) {
        console.error("Mobile UA Failed:", e.response ? e.response.status : e.message);
    }

    // Test 3: Standard fetch headers 
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log("Success with Standard Accept headers, status:", response.status);
    } catch (e) {
        console.error("Standard Fetch headers Failed:", e.response ? e.response.status : e.message);
    }
}

run();
