import axios from "axios";

// Default avatar and voice IDs (used as fallback when none are selected)
const DEFAULT_AVATAR_ID = "Abigail_expressive_2024112501";
const DEFAULT_VOICE_ID = "f8c69e517f424cafaecde32dde57096b";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const videoGeneratorApiKey = (
    process.env.VIDEO_GENERATOR_API_KEY || ""
  ).trim();
  if (!videoGeneratorApiKey) {
    return res.status(500).json({
      error: "Video Generator API key is not configured on the server.",
    });
  }

  try {
    // Trim script to Video Generator's 15-second limit (~35 words max)
    const rawScript =
      req.body.scriptText ||
      req.body.prompt ||
      "Welcome! Discover the future with our powerful AI platform. Learn More.";
    const words = rawScript.trim().split(/\s+/);
    const scriptText =
      words.length > 35 ? words.slice(0, 35).join(" ") + "." : rawScript.trim();

    // Use caller-supplied IDs or fall back to defaults
    const avatarId = (req.body.avatar_id || DEFAULT_AVATAR_ID).trim();
    const avatarType = req.body.avatar_type || "avatar";
    const voiceId = (req.body.voice_id || DEFAULT_VOICE_ID).trim();
    const avatarStyle = req.body.avatar_style || "normal";
    const bgColor = req.body.background_color || "#f5f5f5";
    const speed = parseFloat(req.body.speed) || 1.0;
    const pitch = parseFloat(req.body.pitch) || 0;

    const isTalkingPhoto =
      avatarType === "custom" || avatarType === "talking_photo";
    const characterConfig = isTalkingPhoto
      ? {
          type: "talking_photo",
          talking_photo_id: req.body.avatar_id || avatarId,
        }
      : {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: avatarStyle,
        };

    const payload = {
      title: req.body.topic || "Synapse Video",
      video_inputs: [
        {
          character: characterConfig,
          voice: {
            type: "text",
            input_text: scriptText,
            voice_id: voiceId,
            speed,
            pitch,
          },
        },
      ],
    };

    if (!isTalkingPhoto) {
      payload.video_inputs[0].background = {
        type: "color",
        value: bgColor,
      };
      payload.dimension = {
        width: req.body.width || 1080,
        height: req.body.height || 1920,
      };
    }

    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        ...payload,
        caption: false,
      },
      {
        headers: {
          "x-api-key": videoGeneratorApiKey, // correct header name (lowercase)
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "Video Generator proxy error:",
      error.response?.data || error.message,
    );
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || {
      error: "Failed to generate video via Video Generator API",
    };
    return res.status(statusCode).json(errorMessage);
  }
}
