import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App-simple.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '15px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>
          🎉 Login Successful!
        </h1>

        <div style={{
          background: '#e6f3ff',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          border: '2px solid #667eea'
        }}>
          <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
            Welcome, {username}! 👋
          </h3>
          <p style={{ color: '#666', marginBottom: '0' }}>
            You have successfully logged in to the Todo App!
          </p>
        </div>

        <div style={{
          background: '#f0f9ff',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>✅ What's Working:</h4>
          <ul style={{ textAlign: 'left', color: '#555' }}>
            <li>🔐 Authentication system</li>
            <li>🚀 Express server on port 5000</li>
            <li>⚛️ React app on port 3000</li>
            <li>🔄 API proxy working</li>
            <li>💾 JWT token storage</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          🚪 Logout
        </button>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          <p><strong>Token:</strong> {token.substring(0, 20)}...</p>
          <p>Check browser console for more details!</p>
        </div>
      </div>
    </div>
  );
}
