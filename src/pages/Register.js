import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^\d{10,15}$/.test(String(phone))) {
      setError('Phone must be 10-15 digits');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      // Don't auto-login, redirect to login page
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (_) {
      setError('Network error');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2 className="title">Create Account</h2>
        <p className="subtitle">Join us and start managing your tasks efficiently</p>
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
            <label><i className="bi bi-phone"></i> Phone Number</label>
            <input 
              placeholder="Enter 10-15 digit phone number" 
              value={phone} 
              onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,''))} 
              maxLength="15"
              required
            />
          </div>
          <div className="form-group">
            <label><i className="bi bi-lock"></i> Password</label>
            <input 
              placeholder="Create a strong password" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
            />
            {password && (
              <div className={`password-strength ${
                password.length < 6 ? 'weak' : 
                password.length < 10 ? 'medium' : 'strong'
              }`}></div>
            )}
          </div>
          <div className="form-group">
            <label><i className="bi bi-lock-fill"></i> Confirm Password</label>
            <input 
              placeholder="Re-enter your password" 
              type="password" 
              value={confirm} 
              onChange={e=>setConfirm(e.target.value)} 
              required
            />
          </div>
          {error ? <div className="text-error"><i className="bi bi-exclamation-circle"></i> {error}</div> : null}
          <button type="submit" className="btn btn-primary btn-block">
            <i className="bi bi-person-plus"></i> Create Account
          </button>
        </form>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div className="auth-links">
          <Link to="/login"><i className="bi bi-box-arrow-in-right"></i> Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}
