import { io } from 'socket.io-client';

// Determine backend URL (CRA proxy is used for HTTP, but Socket.IO needs explicit URL)
const DEFAULT_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const socket = io(DEFAULT_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

function authenticate() {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      socket.emit('authenticate', token);
    }
  } catch (_) {}
}

socket.on('connect', () => {
  authenticate();
});

// Re-authenticate when storage token changes (basic approach)
window.addEventListener('storage', (e) => {
  if (e.key === 'token') authenticate();
});

export function reauthenticateSocket() {
  authenticate();
}
