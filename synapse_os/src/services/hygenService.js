import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const HYGEN_API_URL = `${API_BASE_URL}/api/hygen/generate`;
const HYGEN_STATUS_URL = `${API_BASE_URL}/api/hygen/status`;
const VIDEOS_API_URL = `${API_BASE_URL}/api/videos`;

/**
 * Generates a video using backend HeyGen proxy, then auto-saves to Supabase.
 * @param {Object} params
 * @returns {Promise<Object>} - { videoUrl, videoId, saved }
 */
export const generatePoster = async ({ topic, platform, size, tone, cta }) => {
  const prompt = `Create a high-quality marketing script for ${topic} in ${tone} style for ${platform}. Include CTA: ${cta ? cta : 'Learn More'}.`;

  try {
    // 1. Request Video Generation
    const response = await axios.post(
      HYGEN_API_URL,
      { prompt },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, 
      }
    );

    const videoId = response.data?.data?.video_id;
    if (!videoId) {
      throw new Error('Failed to start video generation: No video ID returned.');
    }

    // 2. Poll for Status
    let status = 'processing';
    let videoUrl = null;
    
    let attempts = 0;
    while ((status === 'processing' || status === 'pending') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
      const statusRes = await axios.get(`${HYGEN_STATUS_URL}?video_id=${videoId}`);
      status = statusRes.data?.data?.status;
      
      if (status === 'completed') {
        videoUrl = statusRes.data?.data?.video_url;
        break;
      } else if (status === 'failed') {
        throw new Error(statusRes.data?.data?.error?.message || 'Video generation failed.');
      }
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out.');
    }

    // 3. Auto-save to Supabase
    let saved = false;
    try {
      await saveVideo({ video_id: videoId, video_url: videoUrl, topic, platform, tone, cta });
      saved = true;
      console.log('[HeyGen] Video auto-saved to Supabase');
    } catch (saveErr) {
      console.warn('[HeyGen] Failed to auto-save video:', saveErr.message);
    }

    return { videoUrl, videoId, saved };

  } catch (error) {
    console.error('HeyGen API Error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('The request timed out. HeyGen API is taking too long to respond.');
    }
    throw new Error(error.response?.data?.error || error.message || 'An error occurred while generating the video.');
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
export const saveVideo = async ({ video_id, video_url, topic, platform, tone, cta }) => {
  const response = await axios.post(VIDEOS_API_URL, {
    video_id, video_url, topic, platform, tone, cta
  });
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
 * Maps the size selection to pixel dimensions
 */
const mapSizeToPixels = (size) => {
  switch (size) {
    case '1:1': return '1080x1080';
    case '16:9': return '1920x1080';
    case '4:5': return '1080x1350';
    default: return '1080x1080';
  }
};
