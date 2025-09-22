import {
  handleApiError,
  ERROR_TYPES,
  ERROR_MESSAGES,
  LoadingStates,
  retryRequest,
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  debounce,
  throttle
} from '../errorHandler';

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    success: jest.fn()
  }
}));

describe('errorHandler utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('handles network errors', () => {
      const error = { request: {} };
      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.NETWORK_ERROR);
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR]);
    });

    it('handles auth errors', () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Invalid token' }
        }
      };

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          removeItem: jest.fn(),
          getItem: jest.fn()
        },
        writable: true
      });

      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.AUTH_ERROR);
      expect(result.message).toBe('Invalid token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('handles validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Validation failed' }
        }
      };

      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.VALIDATION_ERROR);
      expect(result.message).toBe('Validation failed');
    });

    it('handles server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {}
        }
      };

      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.SERVER_ERROR);
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_TYPES.SERVER_ERROR]);
    });

    it('handles unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.UNKNOWN_ERROR);
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR]);
    });

    it('uses custom message when provided', () => {
      const error = { request: {} };
      const customMessage = 'Custom error message';

      const result = handleApiError(error, customMessage);

      expect(result.message).toBe(customMessage);
    });
  });

  describe('retryRequest', () => {
    it('returns result on successful first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retryRequest(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('success');

      const result = await retryRequest(mockFn, 2);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('throws error after max retries', async () => {
      const error = new Error('Persistent failure');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(retryRequest(mockFn, 2)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on certain status codes', async () => {
      const error = {
        response: { status: 400 }
      };
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(retryRequest(mockFn, 3)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation functions', () => {
    describe('validateEmail', () => {
      it('validates correct emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      });

      it('rejects invalid emails', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('validates strong passwords', () => {
        expect(validatePassword('Password123')).toBe(true);
        expect(validatePassword('StrongP@ssw0rd')).toBe(true);
      });

      it('rejects weak passwords', () => {
        expect(validatePassword('weak')).toBe(false);
        expect(validatePassword('password')).toBe(false);
        expect(validatePassword('12345678')).toBe(false);
        expect(validatePassword('PASSWORD')).toBe(false);
      });
    });

    describe('validatePhone', () => {
      it('validates correct phone numbers', () => {
        expect(validatePhone('1234567890')).toBe(true);
        expect(validatePhone('123-456-7890')).toBe(true);
        expect(validatePhone('(123) 456-7890')).toBe(true);
        expect(validatePhone('123456789012345')).toBe(true);
      });

      it('rejects invalid phone numbers', () => {
        expect(validatePhone('123')).toBe(false);
        expect(validatePhone('abc-def-ghij')).toBe(false);
        expect(validatePhone('')).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes HTML characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('handles non-string inputs', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('debounce', () => {
    it('debounces function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('throttles function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });

  describe('LoadingStates', () => {
    it('has correct state constants', () => {
      expect(LoadingStates.IDLE).toBe('idle');
      expect(LoadingStates.LOADING).toBe('loading');
      expect(LoadingStates.SUCCESS).toBe('success');
      expect(LoadingStates.ERROR).toBe('error');
    });
  });
});
