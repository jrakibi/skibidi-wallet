// API Configuration
const config = {
  development: {
    API_BASE_URL: 'http://10.0.100.246:8080',
  },
  production: {
    API_BASE_URL: 'https://skibidi-backend-production.up.railway.app',
  }
};

// Use development URL in development, production URL in production builds
export const API_BASE_URL = __DEV__ 
  ? config.development.API_BASE_URL 
  : config.production.API_BASE_URL;

// Helper function to build API endpoints
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 