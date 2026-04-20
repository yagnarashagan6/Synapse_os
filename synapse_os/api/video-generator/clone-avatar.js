import axios from "axios";
import FormData from "form-data";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = (process.env.VIDEO_GENERATOR_API_KEY || "").trim();
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Video Generator API key is not configured." });
  }

  try {
    const { imageBase64, imageName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const buffer = Buffer.from(base64Data, "base64");

    // Use HeyGen's talking photo upload endpoint
    const uploadRes = await axios.post(
      "https://upload.heygen.com/v1/talking_photo",
      buffer,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": contentType,
        },
      },
    );

    const talkingPhotoId =
      uploadRes.data?.data?.talking_photo_id ||
      uploadRes.data?.data?.id ||
      uploadRes.data?.id;

    return res.status(200).json({
      success: true,
      avatar_id: talkingPhotoId,
      preview_url:
        uploadRes.data?.data?.url ||
        uploadRes.data?.url ||
        `data:image/png;base64,${base64Data.substring(0, 100)}...`,
      avatar_type: "talking_photo",
      name: imageName || "Cloned Avatar",
    });
  } catch (error) {
    console.error("Avatar clone error:", error.response?.data || error.message);
    return res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to clone avatar" });
  }
}
