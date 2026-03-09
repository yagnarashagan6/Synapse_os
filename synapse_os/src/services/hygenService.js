import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const HYGEN_GENERATE_AND_WAIT_URL = `${API_BASE_URL}/api/hygen/generate-and-wait`;
const HYGEN_STATUS_URL = `${API_BASE_URL}/api/hygen/status`;
const GROQ_API_URL = `${API_BASE_URL}/api/hygen/generate-script`;
const HYGEN_SYNC_URL = `${API_BASE_URL}/api/hygen/sync`;
const VIDEOS_API_URL = `${API_BASE_URL}/api/videos`;

/**
 * Generates script using Groq
 */
export const generateScriptText = async ({ topic, platform, tone, cta }) => {
  try {
    const response = await axios.post(GROQ_API_URL, { topic, platform, tone, cta });
    return response.data.script || '';
  } catch (error) {
    console.warn('Failed to auto-generate script:', error);
    return '';
  }
};

/**
 * Generates a video using the server-side generate-and-wait endpoint.
 * The server handles all polling and auto-saves to Supabase.
 * The browser makes ONE request and waits for the final result.
 *
 * @param {Object} params
 * @param {Function} params.onProgress - callback(status, percentage) for UI updates
 * @returns {Promise<Object>} - { videoUrl, videoId, saved }
 */
export const generatePoster = async ({ scriptText, topic, platform, size, tone, cta, onProgress }) => {
  let width = 1080;
  let height = 1920;
  if (size === '1:1') { width = 1080; height = 1080; }
  else if (size === '16:9') { width = 1920; height = 1080; }
  else if (size === '4:5') { width = 1080; height = 1350; }

  const prompt = scriptText || `Create a high-quality marketing script for ${topic} in ${tone} style for ${platform}. Include CTA: ${cta ? cta : 'Learn More'}.`;

  const progress = (status, pct) => {
    if (typeof onProgress === 'function') onProgress(status, pct);
  };

  // Start a simulated progress animation while waiting for the server (can take 3–15 min)
  let simulatedPct = 15;
  let progressTimer = null;

  const startProgressSimulation = () => {
    progress('Sending to HeyGen...', 15);
    progressTimer = setInterval(() => {
      // Slowly increment progress up to 88% to show activity (server will tell us when done)
      if (simulatedPct < 88) {
        simulatedPct = Math.min(simulatedPct + 1, 88);
        const statusMsg = simulatedPct < 30
          ? 'Sending to HeyGen...'
          : simulatedPct < 50
          ? 'Video queued — HeyGen is rendering...'
          : simulatedPct < 75
          ? 'Rendering in progress...'
          : 'Almost there...';
        progress(statusMsg, simulatedPct);
      }
    }, 10000); // increment every 10 seconds
  };

  const stopProgressSimulation = () => {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  };

  try {
    startProgressSimulation();

    // Single request — server does all the waiting and saves the result
    const response = await axios.post(
      HYGEN_GENERATE_AND_WAIT_URL,
      { scriptText: prompt, topic, platform, tone, cta, width, height },
      {
        headers: { 'Content-Type': 'application/json' },
        // 16 minute timeout to cover server's 15-minute poll window + buffer
        timeout: 960000,
      }
    );

    stopProgressSimulation();

    const { videoUrl, videoId, saved } = response.data;

    if (!videoUrl) {
      throw new Error('No video URL received from server.');
    }

    progress('Video ready!', 100);
    return { videoUrl, videoId, saved };

  } catch (error) {
    stopProgressSimulation();
    console.error('HeyGen API Error:', error);

    // If timeout due to HeyGen taking too long, provide the videoId if available
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error(
        'Video generation is taking longer than expected. ' +
        'HeyGen is still processing. Please wait a few minutes and click the Refresh button in the Video Library to check if it has completed.'
      );
    }

    const serverError = error.response?.data?.error || error.response?.data?.message;
    const videoId = error.response?.data?.videoId;
    let msg = serverError || error.message || 'An error occurred while generating the video.';
    if (videoId) msg += ` (Video ID: ${videoId} — you can fetch it manually)`;
    throw new Error(msg);
  }
};

/**
 * Manually fetches a video by ID, and if completed, saves it to Supabase.
 */
export const fetchAndSaveVideo = async (videoId) => {
  try {
    const statusRes = await axios.get(`${HYGEN_STATUS_URL}?video_id=${videoId}`);
    const status = statusRes.data?.data?.status;
    const videoUrl = statusRes.data?.data?.video_url;

    if (status === 'completed' && videoUrl) {
      // Save to Supabase with placeholder metadata
      const saved = await saveVideo({
        video_id: videoId,
        video_url: videoUrl,
        topic: 'Manually Fetched Video',
        platform: 'Manual',
        tone: 'Manual',
        cta: ''
      });
      return { videoId, videoUrl, saved: true, data: saved };
    } else if (status === 'failed') {
      throw new Error(statusRes.data?.data?.error?.message || 'Video generation failed.');
    } else {
      throw new Error(`Video is currently: ${status}. Please try again later.`);
    }
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Failed to fetch video');
  }
};

/**
 * Saves video metadata to Supabase via backend
 */
export const saveVideo = async ({ video_id, video_url, topic, platform, ratio, tone, cta }) => {
  const response = await axios.post(VIDEOS_API_URL, {
    video_id, video_url, topic, platform, ratio, tone, cta
  });
  return response.data;
};

/**
 * Updates video metadata in Supabase via backend
 */
export const updateVideo = async (id, updates) => {
  const response = await axios.patch(`${VIDEOS_API_URL}/${id}`, updates);
  return response.data;
};

/**
 * Deletes a video from Supabase via backend
 */
export const deleteVideo = async (id) => {
  const response = await axios.delete(`${VIDEOS_API_URL}/${id}`);
  return response.data;
};

/**
 * Fetches all previously generated videos from Supabase
 */
export const getVideos = async () => {
  const response = await axios.get(VIDEOS_API_URL);
  return response.data;
};

/**
 * Syncs videos from HeyGen to Supabase (auto-fetches completed videos not yet saved)
 */
export const syncHeyGenVideos = async () => {
  const response = await axios.post(HYGEN_SYNC_URL);
  return response.data;
};
