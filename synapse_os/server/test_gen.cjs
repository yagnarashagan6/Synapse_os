require('dotenv').config();
const axios = require('axios');
async function test() {
  try {
    const res = await axios.post("http://localhost:5000/api/video-generator/generate", {
      avatar_id: "Abigail_expressive_2024112501",
      avatar_type: "avatar",
      avatar_style: "normal",
      voice_id: "f8c69e517f424cafaecde32dde57096b",
      scriptText: "Hello",
      topic: "Test Topic",
      width: 1080,
      height: 1920,
      background_color: "#000000",
      background: { type: "color", value: "#000000" },
      voice_type: "audio",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });
    console.log("Success:", res.data);
  } catch(err) {
    console.log("Error:", err.response?.status, err.response?.data);
  }
}
test();
