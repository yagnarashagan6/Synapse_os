const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testActor() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;

    const client = new ApifyClient({
        token: APIFY_TOKEN,
    });


    try {
        console.log('Testing Actor: apify/website-content-crawler...');
        const runInput = {
            startUrls: [{ url: 'https://www.example.com' }],
            maxCrawlDepth: 0,
            maxPagesPerCrawl: 1,
        };
        
        const run = await client.actor('apify/website-content-crawler').call(runInput);
        console.log('Website Content Crawler Run ID:', run.id);
        console.log('Status:', run.status);

        if (run.status === 'SUCCEEDED') {
            console.log('SUCCESS: Crawler works.');
             const { items } = await client.dataset(run.defaultDatasetId).listItems();
             console.log('Items fetched:', items.length);
             if (items.length > 0) {
                 console.log('Title:', items[0].title || items[0].metadata?.title);
             }
        } else {
             console.log('FAILED.');
             const log = await client.run(run.id).log().get();
             console.log('Log:', log.slice(0, 500)); 
        }

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.details) console.error('Details:', error.details);
    }
}

testActor();
