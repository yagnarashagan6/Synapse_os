const axios = require('axios');

async function testKey() {
  const apiKey = "YOUR_OPENAI_API_KEY_HERE";
  try {
    const res = await axios.get("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("SUCCESS: OpenAI API Key is valid.");
  } catch (error) {
    console.error("ERROR: API Key verification failed:", error.response ? error.response.data : error.message);
  }
}

testKey();
