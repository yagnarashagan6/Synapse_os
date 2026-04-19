import axios from "axios";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = (process.env.VIDEO_GENERATOR_API_KEY || "").trim();
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Video Generator API key is not configured on the server." });
  }

  try {
    const response = await axios.get("https://api.heygen.com/v2/voices", {
      headers: { "x-api-key": apiKey },
      timeout: 30000,
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Video Generator voices error:",
      error.response?.data || error.message,
    );
    return res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to fetch voices" });
  }
}
