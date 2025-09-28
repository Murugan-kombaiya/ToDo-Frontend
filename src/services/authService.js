import { toast } from 'react-toastify';

// Configuration - can be easily changed for different environments
const API_BASE_URL = '';
const API_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  resetPassword: '/auth/reset-password'
};

// Demo/Default credentials for automatic login
const DEMO_CREDENTIALS = {
  username: 'murugan@symatic.com',
  password: 'Mukesh9944'
};

// Generic API call function
const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP Error: ${response.status}`);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
};

// Authentication service functions
export const authService = {
  // Register user
  async register(userData) {
    const result = await apiCall(API_ENDPOINTS.register, 'POST', userData);

    if (result.success) {
      // Store token and user data
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('username', result.data.user.username);
      toast.success('Registration successful! Welcome to TaskFlow Pro!');
    } else {
      toast.error(result.error || 'Registration failed');
    }

    return result;
  },

  // Login user
  async login(credentials) {
    const result = await apiCall(API_ENDPOINTS.login, 'POST', credentials);

    if (result.success) {
      // Store token and user data
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('username', result.data.user.username);
      toast.success('Login successful!');
    } else {
      toast.error(result.error || 'Login failed');
    }

    return result;
  },


  // Reset Password
  async resetPassword(resetData) {
    const result = await apiCall(API_ENDPOINTS.resetPassword, 'POST', resetData);

    if (result.success) {
      toast.success('Password reset successful! You can now login with your new password.');
    } else {
      toast.error(result.error || 'Failed to reset password');
    }

    return result;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user
  getCurrentUser() {
    return {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username')
    };
  },

  // Auto-login with demo credentials
  async autoLogin() {
    try {
      const result = await this.login(DEMO_CREDENTIALS);
      if (result.success) {
        // Set auto-login flag
        localStorage.setItem('autoLoginMode', 'true');
        toast.success('Auto-login successful! Demo mode activated.');
      }
      return result;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if auto-login mode is enabled
  isAutoLoginMode() {
    return localStorage.getItem('autoLoginMode') === 'true';
  },

  // Enable/disable auto-login mode
  setAutoLoginMode(enabled) {
    if (enabled) {
      localStorage.setItem('autoLoginMode', 'true');
    } else {
      localStorage.removeItem('autoLoginMode');
    }
  },

  // Check if auto-login should be performed
  shouldAutoLogin() {
    const autoLoginMode = this.isAutoLoginMode();
    const isAuthenticated = this.isAuthenticated();

    // Auto-login if enabled and not already authenticated
    return autoLoginMode && !isAuthenticated;
  },

  // Enhanced logout that respects auto-login mode
  logout(disableAutoLogin = false) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');

    if (disableAutoLogin) {
      localStorage.removeItem('autoLoginMode');
    }

    toast.success('Logged out successfully');
  }
};

// Export individual functions for convenience
export const { register, login, resetPassword, logout, isAuthenticated, getCurrentUser, autoLogin, isAutoLoginMode, setAutoLoginMode, shouldAutoLogin } = authService;