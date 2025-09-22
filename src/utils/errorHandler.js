import { toast } from 'react-toastify';

// Error types for better error handling
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages mapping
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: 'Unable to connect to server. Please check your internet connection.',
  [ERROR_TYPES.AUTH_ERROR]: 'Authentication failed. Please login again.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_TYPES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// API Error Handler
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);

  let errorType = ERROR_TYPES.UNKNOWN_ERROR;
  let message = customMessage;

  // Determine error type based on error response
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        errorType = ERROR_TYPES.VALIDATION_ERROR;
        break;
      case 401:
        errorType = ERROR_TYPES.AUTH_ERROR;
        // Auto logout on auth error
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
        break;
      case 403:
        errorType = ERROR_TYPES.PERMISSION_DENIED;
        break;
      case 404:
        errorType = ERROR_TYPES.NOT_FOUND;
        break;
      case 429:
        errorType = ERROR_TYPES.RATE_LIMIT;
        break;
      case 500:
      case 502:
      case 503:
        errorType = ERROR_TYPES.SERVER_ERROR;
        break;
      default:
        errorType = ERROR_TYPES.SERVER_ERROR;
    }

    // Use server error message if available
    if (data && data.error) {
      message = data.error;
    }
  } else if (error.request) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
  }

  // Show toast notification
  const finalMessage = message || ERROR_MESSAGES[errorType];

  switch (errorType) {
    case ERROR_TYPES.AUTH_ERROR:
      toast.error(finalMessage);
      break;
    case ERROR_TYPES.VALIDATION_ERROR:
      toast.warning(finalMessage);
      break;
    case ERROR_TYPES.NETWORK_ERROR:
    case ERROR_TYPES.SERVER_ERROR:
      toast.error(finalMessage);
      break;
    default:
      toast.error(finalMessage);
  }

  return {
    type: errorType,
    message: finalMessage,
    originalError: error
  };
};

// Loading States Manager
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.response && [400, 401, 403, 404].includes(error.response.status)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// Network status checker
export const checkNetworkStatus = () => {
  return navigator.onLine;
};

// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
