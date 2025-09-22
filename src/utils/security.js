// Security hardening utilities for the ToDo application

// Content Security Policy (CSP) utilities
export const generateCSPHeader = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Consider removing unsafe-inline for production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.example.com wss://socket.example.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  };
};

// XSS Protection utilities
export const sanitizeHtml = (html) => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Input validation for security
export const validateInput = (input, type) => {
  const validators = {
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) && value.length <= 254;
    },
    username: (value) => {
      // Allow alphanumeric, underscore, hyphen, 3-30 characters
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      return usernameRegex.test(value);
    },
    password: (value) => {
      // Strong password requirements
      return value.length >= 8 &&
             value.length <= 128 &&
             /[a-z]/.test(value) &&
             /[A-Z]/.test(value) &&
             /[0-9]/.test(value) &&
             /[^a-zA-Z0-9]/.test(value);
    },
    phone: (value) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      return phoneRegex.test(value);
    },
    text: (value) => {
      // Basic text validation - no HTML, reasonable length
      return typeof value === 'string' &&
             value.length <= 10000 &&
             !/<[^>]*>/.test(value);
    },
    number: (value) => {
      const num = Number(value);
      return !isNaN(num) && isFinite(num) && num >= 0;
    }
  };

  const validator = validators[type];
  if (!validator) {
    throw new Error(`Unknown validation type: ${type}`);
  }

  return validator(input);
};

// Rate limiting helper
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    const existing = this.requests.get(key) || [];

    // Filter out old requests
    const recentRequests = existing.filter(time => time > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Create global rate limiter instance
export const rateLimiter = new RateLimiter();

// Clean up old entries periodically
setInterval(() => rateLimiter.cleanup(), 60000);

// CSRF Protection helper
export const generateCSRFToken = () => {
  const token = Math.random().toString(36).substring(2) +
                Math.random().toString(36).substring(2);
  sessionStorage.setItem('csrf_token', token);
  return token;
};

export const validateCSRFToken = (token) => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
};

// Security headers middleware (for backend)
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Input sanitization for forms
export const sanitizeFormData = (formData) => {
  const sanitized = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value.trim());
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Secure random string generator
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Security event logging
export const logSecurityEvent = (event, details = {}) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details
  };

  console.warn('Security Event:', securityLog);

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to security service
    console.log('Would send to security service:', securityLog);
  }
};

// Detect suspicious activity
export const detectSuspiciousActivity = (activity) => {
  const suspiciousPatterns = {
    rapidRequests: () => {
      const recentRequests = JSON.parse(localStorage.getItem('recent_requests') || '[]');
      const now = Date.now();
      const recentCount = recentRequests.filter(time => now - time < 1000).length;

      if (recentCount > 5) {
        logSecurityEvent('RAPID_REQUESTS', { count: recentCount });
        return true;
      }

      recentRequests.push(now);
      if (recentRequests.length > 100) {
        recentRequests.shift();
      }
      localStorage.setItem('recent_requests', JSON.stringify(recentRequests));

      return false;
    },

    unusualUserAgent: () => {
      const userAgent = navigator.userAgent;
      const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];

      if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
        logSecurityEvent('SUSPICIOUS_USER_AGENT', { userAgent });
        return true;
      }

      return false;
    },

    invalidInputPattern: (input) => {
      const sqlPatterns = /(\bselect\b|\bunion\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/i;
      const scriptPatterns = /(<script|javascript:|on\w+=)/i;

      if (sqlPatterns.test(input) || scriptPatterns.test(input)) {
        logSecurityEvent('INVALID_INPUT_PATTERN', { input: input.substring(0, 100) });
        return true;
      }

      return false;
    }
  };

  return Object.values(suspiciousPatterns).some(pattern => pattern(activity));
};

// Secure localStorage wrapper
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      logSecurityEvent('STORAGE_ERROR', { error: error.message });
      throw error;
    }
  },

  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const decrypted = JSON.parse(atob(item));
      return decrypted;
    } catch (error) {
      logSecurityEvent('STORAGE_ERROR', { error: error.message });
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logSecurityEvent('STORAGE_ERROR', { error: error.message });
    }
  }
};

export default {
  generateCSPHeader,
  sanitizeHtml,
  sanitizeObject,
  validateInput,
  rateLimiter,
  generateCSRFToken,
  validateCSRFToken,
  securityHeaders,
  sanitizeFormData,
  generateSecureToken,
  logSecurityEvent,
  detectSuspiciousActivity,
  secureStorage
};
