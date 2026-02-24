const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testToken() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;

    console.log('Testing Token:', APIFY_TOKEN);


    const client = new ApifyClient({
        token: APIFY_TOKEN,
    });

    try {
        console.log('Fetching user info...');
        const user = await client.user().get();
        if (user) {
            console.log('SUCCESS: Token is valid.');
            console.log('User ID:', user.id);
            console.log('Username:', user.username || 'N/A');
        } else {
            console.log('FAILED: User info is null (Token might be invalid or permissions missing).');
        }
    } catch (error) {
        console.log('CRITICAL FAILURE:');
        console.log(error.message);
        if (error.details) console.log('Details:', error.details);
    }
}

testToken();
