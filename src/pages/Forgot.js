import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Forgot() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch('/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Reset failed');
        return;
      }
      setStatus('Password updated. You can login now.');
    } catch (_) {
      setStatus('Network error');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2 className="title">Forgot Password</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label>Username</label>
            <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input placeholder="New Password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </div>
          {status ? (
            <div className={status.includes('updated') ? 'text-success' : 'text-error'}>{status}</div>
          ) : null}
          <button type="submit" className="btn btn-primary btn-block">Reset</button>
        </form>
        <div style={{marginTop:10}}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
