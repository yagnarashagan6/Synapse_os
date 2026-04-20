require('dotenv').config();
const axios = require('axios');
async function test() {
  const apiKey = process.env.VIDEO_GENERATOR_API_KEY;
  if(!apiKey) { console.log("no key"); return; }
  try {
    const res = await axios.get("https://api.heygen.com/v1/video_status.get?video_id=c09758b466f445089a9dcf6f0df24e4a", {
      headers: { "x-api-key": apiKey }
    });
    console.log("Status:", res.data.data.status, "Error:", res.data.data.error);
  } catch(err) {
    console.log("Error:", err.response?.status, err.response?.data);
  }
}
test();
