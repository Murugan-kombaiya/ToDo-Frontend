import { authService } from '../services/authService';

// Enhanced authHeaders function with token validation
export function authHeaders() {
  const token = localStorage.getItem('token');

  // Skip validation if no token
  if (!token) {
    return {};
  }

  // Check if token is likely expired before using it
  if (isTokenLikelyExpired(token)) {
    console.warn('Token appears expired, clearing from storage');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

// Enhanced fetch wrapper that handles authentication errors
export async function authenticatedFetch(url, options = {}) {
  // Import API configuration
  const getApiBaseUrl = () => {
    // Production URL for mobile and web
    if (window.Capacitor || process.env.NODE_ENV === 'production') {
      return 'https://yamabiko.proxy.rlwy.net';
    }
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
    return 'http://localhost:3001';
  };

  // Create full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;

  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...options.headers
  };

  console.log(`Authenticated API Call: ${options.method || 'GET'} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('Token expired or invalid, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('username');

      // Trigger auto-login if enabled
      if (authService.isAutoLoginMode()) {
        try {
          await authService.autoLogin();
          // Retry the original request with new token
          const newHeaders = {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...options.headers
          };
          return fetch(url, {
            ...options,
            headers: newHeaders
          });
        } catch (autoLoginError) {
          console.error('Auto-login failed:', autoLoginError);
          window.location.reload();
          return response;
        }
      } else {
        // Redirect to login or reload
        window.location.reload();
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Check if a token is likely expired (simple heuristic)
export function isTokenLikelyExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < currentTime;
  } catch (error) {
    console.warn('Error parsing token:', error);
    return true;
  }
}

// Validate current token and refresh if needed
export async function ensureValidToken() {
  const token = localStorage.getItem('token');

  if (!token || isTokenLikelyExpired(token)) {
    console.log('Token missing or expired, attempting refresh');

    if (authService.isAutoLoginMode()) {
      try {
        const result = await authService.autoLogin();
        return result.success;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    }
    return false;
  }

  return true;
}