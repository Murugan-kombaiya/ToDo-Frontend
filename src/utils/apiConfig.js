// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in a mobile environment (Capacitor)
  if (window.Capacitor) {
    // Use network IP for mobile devices
    return 'http://192.168.1.2:3001';
  }

  // Check environment variable first
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Default to localhost for web browser
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Enhanced fetch wrapper with automatic URL prefixing
export const apiFetch = async (endpoint, options = {}) => {
  const url = createApiUrl(endpoint);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth headers if token exists
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log(`API Call: ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('Token expired or invalid, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }

    return response;
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
};

export default {
  API_BASE_URL,
  createApiUrl,
  apiFetch
};