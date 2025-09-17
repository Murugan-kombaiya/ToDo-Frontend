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
    <div className="app-container">
      <h2 className="title">Forgot Password</h2>
      <form onSubmit={onSubmit} className="input-section" style={{flexDirection:'column'}}>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="New Password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        {status ? <div style={{color: status.includes('updated') ? '#2ecc71' : '#e74c3c'}}>{status}</div> : null}
        <button type="submit" className="add-btn">Reset</button>
      </form>
      <div style={{marginTop:10}}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
