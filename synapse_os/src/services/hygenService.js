import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const HYGEN_API_URL = `${API_BASE_URL}/api/hygen/generate`;
const HYGEN_STATUS_URL = `${API_BASE_URL}/api/hygen/status`;

/**
 * Generates a video using backend HeyGen proxy
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} params.platform
 * @param {string} params.size
 * @param {string} params.tone
 * @param {string} params.cta
 * @returns {Promise<string>} - Returns the generated video URL
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
    
    // Poll every 10 seconds for up to 5 minutes
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

    return videoUrl;

  } catch (error) {
    console.error('HeyGen API Error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('The request timed out. HeyGen API is taking too long to respond.');
    }
    throw new Error(error.response?.data?.error || error.message || 'An error occurred while generating the video.');
  }
};

/**
 * Maps the size selection to pixel dimensions
 * @param {string} size - e.g., '1:1', '16:9', '4:5'
 * @returns {string} - Pixel dimensions
 */
const mapSizeToPixels = (size) => {
  switch (size) {
    case '1:1': return '1080x1080';
    case '16:9': return '1920x1080';
    case '4:5': return '1080x1350';
    default: return '1080x1080';
  }
};
