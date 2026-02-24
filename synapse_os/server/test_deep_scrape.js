const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testDeepScrape() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const client = new ApifyClient({ token: APIFY_TOKEN });
    const USERNAME = 'nike'; 

    try {
        console.log(`Testing apify/instagram-scraper for 20 posts...`);
        // Note: 'apify/instagram-scraper' often takes 'addParentData' to include profile info with posts
        const runInput = {
            directUrls: [`https://www.instagram.com/${USERNAME}/`],
            resultsType: "posts",
            resultsLimit: 20, // Requesting 20 to see if we get > 12
        };

        const run = await client.actor('apify/instagram-scraper').call(runInput);
        console.log('Run STATUS:', run.status);

        if (run.status === 'SUCCEEDED') {
             const { items } = await client.dataset(run.defaultDatasetId).listItems();
             console.log('Items fetched:', items.length);
             
             if (items.length > 0) {
                 console.log('First Item Keys:', Object.keys(items[0]));
                 // Check if it returned posts or just profile
                 const isPost = items[0].type === 'Image' || items[0].type === 'Video' || items[0].type === 'Sidecar';
                 console.log('Is it a post?', isPost);
                 console.log('Snippet:', JSON.stringify(items[0]).slice(0, 100));
             }
        } else {
             const log = await client.run(run.id).log().get();
             console.log('Log:', log.slice(0, 500)); 
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testDeepScrape();
