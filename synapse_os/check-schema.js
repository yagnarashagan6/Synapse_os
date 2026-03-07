require('dotenv').config();
const { ApifyClient } = require('apify-client');
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

async function check() {
  try {
    const actor = await client.actor('harvestapi/linkedin-profile-posts').get();
    const version = actor.versions[0];
    console.log(JSON.stringify(version, null, 2));
  } catch (err) {
    console.error(err);
  }
}
check();
