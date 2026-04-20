require('dotenv').config();
const axios = require('axios');
async function test() {
  const apiKey = process.env.VIDEO_GENERATOR_API_KEY;
  if(!apiKey) { console.log("no key"); return; }
  try {
    const res = await axios.post("https://api.heygen.com/v2/video/generate", {
      title: "Test Audio",
      video_inputs: [{
        character: { type: "avatar", avatar_id: "Abigail_expressive_2024112501", avatar_style: "normal" },
        voice: { type: "audio", audio_url: "https://invalid-url-that-doesnt-exist.com/sound.mp3" },
        background: { type: "color", value: "#f5f5f5" }
      }],
      dimension: { width: 1080, height: 1920 }
    }, {
      headers: { "x-api-key": apiKey }
    });
    console.log("Success:", res.data);
  } catch(err) {
    console.log("Error:", err.response?.status, err.response?.data);
  }
}
test();
