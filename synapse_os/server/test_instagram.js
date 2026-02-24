const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testInstagram() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const client = new ApifyClient({ token: APIFY_TOKEN });
    const PROFILE = 'nike'; 

    try {
        console.log(`Testing apify/instagram-profile-scraper...`);
        const runInput = {
            usernames: [PROFILE],
        };

        const run = await client.actor('apify/instagram-profile-scraper').call(runInput);
        console.log('Run STATUS:', run.status);

        if (run.status === 'SUCCEEDED') {
             const { items } = await client.dataset(run.defaultDatasetId).listItems();
             console.log('Items fetched:', items.length);
             
             if (items.length > 0) {
                 const item = items[0];
                 console.log('--- Profile Data ---');
                 console.log('Username:', item.username);
                 console.log('Followers:', item.followersCount);
                 console.log('Posts Count:', item.postsCount);
                 
                 if (item.latestPosts) {
                     console.log(`--- Latest Posts (${item.latestPosts.length}) ---`);
                     item.latestPosts.slice(0, 3).forEach((post, i) => {
                         console.log(`Post ${i+1}:`);
                         console.log('  Date:', post.timestamp);
                         console.log('  Likes:', post.likesCount);
                         console.log('  Comments:', post.commentsCount);
                         console.log('  Values:', post.dimensionsHeight); // Check if dimensions exist
                     });
                 } else {
                     console.log('No latestPosts field found.');
                     console.log('Available keys:', Object.keys(item));
                 }
             }
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testInstagram();
