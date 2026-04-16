const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const ELEVENLABS_API_KEY = "sk_27542ae05f79644e8f11d7bfe6c9479825464c9a3ecdbefa"; // Default from index.js
  
  if (process.env.ELEVENLABS_API_KEY) {
      console.log("Using API key from env");
  }

  const apiKey = process.env.ELEVENLABS_API_KEY || ELEVENLABS_API_KEY;

  const fd = new FormData();
  fd.append("name", "Test Voice");
  fd.append("description", "A test voice");
  
  // Attach a dummy file
  const buffer = fs.readFileSync(__dirname + '/package.json');
  fd.append("files", buffer, {
    filename: "sample_0.wav",
    contentType: "audio/wav",
  });

  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/voices/add",
      fd,
      {
        headers: {
          ...fd.getHeaders(),
          "xi-api-key": apiKey,
        },
      }
    );
    console.log("Success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error:", error.message);
    }
  }
}

test();
