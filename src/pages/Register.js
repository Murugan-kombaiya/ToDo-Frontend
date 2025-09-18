import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
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
        <h2 className="title">Create Account</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label>Username</label>
            <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input placeholder="Confirm Password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </div>
          {error ? <div className="text-error">{error}</div> : null}
          <button type="submit" className="btn btn-primary btn-block">Create account</button>
        </form>
        <div style={{marginTop:10}}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
