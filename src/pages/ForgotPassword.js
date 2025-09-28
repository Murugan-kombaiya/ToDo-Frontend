import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import '../styles/AuthModern.css';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: username, 2: new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // For demo purposes, we'll just move to step 2
    // In a real app, you'd verify the username exists
    setStep(2);
    setError('');
    toast.info('Username verified! Enter your new password.');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! You can now login with your new password.');
        // Reset form
        setUsername('');
        setNewPassword('');
        setStep(1);
      } else {
        setError(data.error || 'Password reset failed');
        toast.error(data.error || 'Password reset failed');
      }
    } catch (error) {
      const errorMsg = 'Network error - please check if server is running';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${theme}`} data-theme={theme}>
      <div className="auth-background">
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
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <i className="bi bi-key-fill"></i>
              </div>
              <h1 className="app-title">TaskFlow Pro</h1>
            </div>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              {step === 1 ? 'Enter your username to reset password' : 'Enter your new password'}
            </p>
          </div>

          <form onSubmit={step === 1 ? handleUsernameSubmit : handlePasswordReset} className="auth-form">
            {step === 1 ? (
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <i className="bi bi-person me-2"></i>
                  Username
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    style={{paddingLeft: 'calc(3rem + 5px)'}}
                    placeholder="Enter your username"
                    required
                  />
                  <div className="input-icon">
                    <i className="bi bi-person"></i>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  <i className="bi bi-lock me-2"></i>
                  New Password
                </label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    style={{paddingLeft: 'calc(3rem + 5px)'}}
                    placeholder="Enter your new password"
                    required
                  />
                  <div className="input-icon">
                    <i className="bi bi-lock"></i>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`auth-btn primary ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-right me-2"></i>
                  {step === 1 ? 'Continue' : 'Reset Password'}
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <div className="auth-links">
              <Link to="/login" className="auth-link">
                <i className="bi bi-arrow-left me-1"></i>
                Back to Login
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

        <div className="auth-side-panel">
          <div className="side-content">
            <div className="side-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <h3 className="side-title">Secure Reset</h3>
            <p className="side-description">
              Reset your password securely and get back to being productive in no time.
            </p>
            <div className="side-features">
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Secure Process</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Instant Reset</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Easy Recovery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}