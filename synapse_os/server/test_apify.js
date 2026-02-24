const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testApify() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;

    const client = new ApifyClient({
        token: APIFY_TOKEN,
    });


    try {
        console.log('Testing apify/google-search-scraper with STRING queries...');
        const runInput = {
            queries: 'Nike', // Changed from array to string
            maxPagesPerQuery: 1,
            resultsPerPage: 1,
        };
        
        const run = await client.actor('apify/google-search-scraper').call(runInput);
        console.log('Run ID:', run.id);
        console.log('Status:', run.status);

    } catch (error) {
        console.log('ERROR MESSAGE:', error.message);
        if (error.details) console.log('ERROR DETAILS:', JSON.stringify(error.details));
    }
}

testApify();
