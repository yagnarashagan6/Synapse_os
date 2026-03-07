// Centralized API base URL configuration
// In development (localhost): points to the local Express server
// In production (Vercel): uses relative paths (same origin) to hit serverless functions
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDev ? 'http://localhost:5000' : 'https://synapse-os.onrender.com';
