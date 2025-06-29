// API Configuration
const config = {
  development: {
    API_BASE_URL: 'https://skibidi-backend-production.up.railway.app',
    BITCOIN_NETWORK: 'mainnet', // Changed from default testnet to mainnet
  },
  production: {
    API_BASE_URL: 'https://skibidi-backend-production.up.railway.app',
    BITCOIN_NETWORK: 'mainnet', // Ensure production uses mainnet
  }
};

// Use development URL in development, production URL in production builds
export const API_BASE_URL = __DEV__ 
  ? config.development.API_BASE_URL 
  : config.production.API_BASE_URL;

// Export Bitcoin network configuration
export const BITCOIN_NETWORK = __DEV__
  ? config.development.BITCOIN_NETWORK
  : config.production.BITCOIN_NETWORK;

// Helper function to build API endpoints
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 