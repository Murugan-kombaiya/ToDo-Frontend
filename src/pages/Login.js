import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      navigate('/');
    } catch (_) {
      setError('Network error');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2 className="title">Welcome Back!</h2>
        <p className="subtitle">Login to continue to your dashboard</p>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label><i className="bi bi-person"></i> Username</label>
            <input 
              placeholder="Enter your username" 
              value={username} 
              onChange={e=>setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label><i className="bi bi-lock"></i> Password</label>
            <input 
              placeholder="Enter your password" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="remember-me">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>
          
          {error ? <div className="text-error"><i className="bi bi-exclamation-circle"></i> {error}</div> : null}
          
          <button type="submit" className="btn btn-primary btn-block">
            <i className="bi bi-box-arrow-in-right"></i> Login
          </button>
        </form>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div className="social-login">
          <button className="social-btn" disabled>
            <i className="bi bi-google"></i> Google
          </button>
          <button className="social-btn" disabled>
            <i className="bi bi-github"></i> GitHub
          </button>
        </div>
        
        <div className="auth-links">
          <Link to="/register"><i className="bi bi-person-plus"></i> Create New Account</Link>
          <Link to="/forgot"><i className="bi bi-key"></i> Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}
