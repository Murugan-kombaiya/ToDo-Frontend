import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import '../styles/AuthModern.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Removed automatic redirect to allow access to login page

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        toast.success('Login successful! Welcome back!');
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
        toast.error(data.error || 'Login failed');
        console.error('❌ Login failed:', data);
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
        <div className="auth-card">
          {/* Header Section */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h1 className="app-title">TaskFlow Pro</h1>
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-person me-2"></i>
                Username or Email
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  style={{paddingLeft: 'calc(3rem + 5px)'}}
                  placeholder="Enter your username or email"
                  required
                  autoComplete="username"
                />
                <div className="input-icon">
                  <i className="bi bi-person"></i>
                </div>
              </div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{paddingLeft: 'calc(3rem + 5px)'}}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>

          </form>

          {/* Footer Links */}
          <div className="auth-footer">
            <div className="auth-links">
              <Link to="/forgot-password" className="auth-link">
                <i className="bi bi-question-circle me-1"></i>
                Forgot Password?
              </Link>
            </div>

            <div className="auth-divider">
              <span>Don't have an account?</span>
            </div>

            <Link to="/register" className="auth-btn outline">
              <i className="bi bi-person-plus me-2"></i>
              Create Account
            </Link>
          </div>
        </div>

        {/* Side Panel - Desktop Only */}
        <div className="auth-side-panel">
          <div className="side-content">
            <div className="side-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h3 className="side-title">Boost Your Productivity</h3>
            <p className="side-description">
              Organize tasks, track progress, and achieve your goals with our powerful productivity tools.
            </p>
            <div className="side-features">
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Task Management</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Progress Tracking</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Goal Setting</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Team Collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}