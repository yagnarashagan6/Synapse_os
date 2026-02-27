import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hygenApiKey = process.env.HYGEN_API_KEY;
  if (!hygenApiKey) {
    return res.status(500).json({ error: 'HeyGen API key is not configured on the server.' });
  }

  try {
    const response = await axios.post(
      'https://api.heygen.com/v2/video/generate',
      {
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: 'Angela-inTshirt-20220820',
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: req.body.prompt || 'Hello! This is a generated video.',
              voice_id: '1bd001e7e50f421d891986aad5158bc8',
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
      },
      {
        headers: {
          'X-Api-Key': hygenApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('HeyGen proxy error:', error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || { error: 'Failed to generate video via HeyGen API' };
    return res.status(statusCode).json(errorMessage);
  }
}
