import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const videoGeneratorApiKey = process.env.VIDEO_GENERATOR_API_KEY;
  const videoId = req.query.video_id;

  if (!videoGeneratorApiKey || !videoId) {
    return res.status(400).json({ error: 'Missing API key or video_id' });
  }

  try {
    const response = await axios.get(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        headers: { 'X-Api-Key': videoGeneratorApiKey },
        timeout: 10000,
      }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Video Generator status error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed' });
  }
}
