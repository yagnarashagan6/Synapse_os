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

  const { topic, platform, tone, cta, language } = req.body;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured.' });
  }

  try {
    const prompt = `Write a short, engaging video script (around 30-40 seconds spoken, keep it conversational and natural) about "${topic}" for "${platform}" in a "${tone}" tone. The script must end with a Call to Action: "${cta || 'Learn More'}". The script MUST be written in the following language: ${language || 'English'}. Provide ONLY the exact words to be spoken by an AI avatar. Do not include camera directions, brackets, speaker labels, emojis, or any other meta-text. Just the raw spoken script.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    let scriptText = response.data.choices[0]?.message?.content?.trim();
    
    // Fallback if empty
    if (!scriptText) {
      scriptText = `Welcome! Today we are talking about ${topic}. This is essential for anyone looking to stay ahead in ${platform}. ${cta || 'Learn more'}.`;
    }

    return res.status(200).json({ script: scriptText });
  } catch (error) {
    console.error('OpenAI generation error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to generate script' });
  }
}
