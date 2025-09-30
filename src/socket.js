import { io } from 'socket.io-client';

// Local socket configuration with fallback
const getSocketUrl = () => {
  // Production URL for mobile and web
  if (window.Capacitor || process.env.NODE_ENV === 'production') {
    return 'https://yamabiko.proxy.rlwy.net';
  }
  // For web browser development
  return 'http://localhost:3001';
};

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || getSocketUrl();

console.log('🔌 Initializing Socket.IO with URL:', SOCKET_URL);

// Initialize socket connection with proper configuration
export const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  upgrade: true,
  rememberUpgrade: false,
  timeout: 20000,
  forceNew: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5,
  autoConnect: true
});

// Socket event handlers
socket.on('connect', () => {
  console.log('✅ Socket connected successfully');
  authenticate();
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔥 Socket connection error:', error);
});

socket.on('authenticated', (data) => {
  console.log('🔐 Socket authenticated successfully:', data);
});

socket.on('auth_error', (error) => {
  console.error('🚫 Socket authentication error:', error);
});

function authenticate() {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔑 Authenticating socket with token');
      socket.emit('authenticate', token);
    } else {
      console.log('⚠️ No token found for socket authentication');
    }
  } catch (error) {
    console.error('❌ Socket authentication failed:', error);
  }
}

// Re-authenticate when storage token changes
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    console.log('🔄 Token changed, re-authenticating socket');
    authenticate();
  }
});

export function reauthenticateSocket() {
  console.log('🔄 Manual socket re-authentication triggered');
  authenticate();
}
