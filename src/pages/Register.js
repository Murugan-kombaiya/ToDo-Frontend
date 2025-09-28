import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import '../styles/AuthModern.css';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Removed automatic redirect to allow access to register page

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // Real-time password strength update
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation errors as user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9@._-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, @, ., _, -';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Attempting registration for:', formData.username);
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('📡 Registration response:', response.status, data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        console.log('✅ Registration successful, redirecting to dashboard');
        toast.success('Account created successfully! Welcome to TaskFlow Pro!');
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
        toast.error(data.error || 'Registration failed');
        console.error('❌ Registration failed:', data);
      }
    } catch (error) {
      const errorMsg = 'Network error - please check if server is running';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return 'Very Weak';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#ef4444';
      case 2: return '#f97316';
      case 3: return '#eab308';
      case 4: return '#22c55e';
      case 5: return '#16a34a';
      default: return '#ef4444';
    }
  };

  return (
    <div className={`auth-container ${theme}`} data-theme={theme}>
      <div className="auth-background">
        {/* Animated Background Elements */}
        <div className="floating-elements">
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-card register-card">
          {/* Header Section */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <i className="bi bi-person-plus-fill"></i>
              </div>
              <h1 className="app-title">TaskFlow Pro</h1>
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join thousands of productive users</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-person me-2"></i>
                Username
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.username ? 'error' : ''}`}
                  style={{paddingLeft: 'calc(3rem + 5px)'}}
                  placeholder="Choose a unique username"
                  required
                  autoComplete="username"
                />
                <div className="input-icon">
                  <i className="bi bi-person"></i>
                </div>
              </div>
              {validationErrors.username && (
                <div className="field-error">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {validationErrors.username}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock me-2"></i>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  style={{paddingLeft: 'calc(3rem + 5px)'}}
                  placeholder="Create a secure password"
                  required
                  autoComplete="new-password"
                />
                <div className="input-icon">
                  <i className="bi bi-lock"></i>
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span
                    className="strength-text"
                    style={{ color: getPasswordStrengthColor() }}
                  >
                    {getPasswordStrengthLabel()}
                  </span>
                </div>
              )}

              {validationErrors.password && (
                <div className="field-error">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {validationErrors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <i className="bi bi-shield-check me-2"></i>
                Confirm Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  style={{paddingLeft: 'calc(3rem + 5px)'}}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                <div className="input-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div className="field-error">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {validationErrors.confirmPassword}
                </div>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="field-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Passwords match
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`auth-btn primary ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="auth-footer">
            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="auth-btn outline">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Sign In
            </Link>
          </div>
        </div>

        {/* Side Panel - Desktop Only */}
        <div className="auth-side-panel">
          <div className="side-content">
            <div className="side-icon">
              <i className="bi bi-rocket-takeoff"></i>
            </div>
            <h3 className="side-title">Start Your Journey</h3>
            <p className="side-description">
              Join our community of productive individuals and transform the way you work and learn.
            </p>
            <div className="side-features">
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Free to Get Started</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Unlimited Tasks</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Progress Analytics</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Cross-Platform Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}