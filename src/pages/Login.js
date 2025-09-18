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
        <h2 className="title">Login</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label>Username</label>
            <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error ? <div className="text-error">{error}</div> : null}
          <button type="submit" className="btn btn-primary btn-block">Login</button>
        </form>
        <div style={{marginTop:10}}>
          <Link to="/register">Register</Link> · <Link to="/forgot">Forgot Password</Link>
        </div>
      </div>
    </div>
  );
}
