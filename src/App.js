import React from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer} from "react-toastify";
import RouteChangeLoader from './components/RouteChangeLoader';
import RealtimeEvents from "./components/RealtimeEvents";
import "./App.css";
import Forgot from "./pages/Forgot.js";
import Sidebar from "./components/Sidebar.js";
import Dashboard from "./pages/Dashboard.js"
import Tasks from "./pages/Tasks.js";
import Board from "./pages/Board.js";
import Pomodoro from "./pages/Pomodoro.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import ErrorBoundary from './components/ErrorBoundary';
import "./styles/pomodoro.css";
import './styles/TimeTracker.css';
import './styles/Goals.css';
import './styles/HabitTracker.css';
import TimeTracker from "./pages/TimeTracker.js";
import Goals from "./pages/Goals.js";
import HabitTracker from "./pages/HabitTracker.js";

function Header() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <div className="navbar">
        <div className="nav-inner">
          <div className="nav-left">
            <button className="mobile-menu-btn desktop-only" onClick={toggleSidebar} aria-label="Toggle menu">
              <i className="bi bi-list"></i>
            </button>
            <Link className="brand" to="/">📝 Todo</Link>
            <div className="muted" style={{marginLeft:10}}>
              {new Date().toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'})}
            </div>
          </div>
          <div className="nav-actions">
            <Link to="/pomodoro" className="nav-link desktop-only">Pomodoro</Link>
            <Link to="/board" className="nav-link desktop-only">Kanban</Link>
            <Link to="/tasks" className="nav-link desktop-only">List</Link>
            <button className="theme-toggle mobile-only" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-outline theme-btn desktop-only" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </button>
            <a href="/#quick-add" className="btn btn-primary desktop-only">+ Quick Add</a>
            {username ? (
              <>
                <span className="username desktop-only" style={{marginRight:10}}>Hello, {username}</span>
                <button className="btn btn-danger" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
    </>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot'].includes(location.pathname);

  return (
    <ErrorBoundary>
      {/* Global 1s loader on route changes */}
      <RouteChangeLoader minDurationMs={1000} />
      {/* Global toast container for notifications */}
      <ToastContainer position="top-right" autoClose={4000} theme={localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'} newestOnTop/>
      {/* Real-time socket listeners */}
      <RealtimeEvents />
      
      {!isAuthPage && <Header />}
      
      <div className={isAuthPage ? "auth-layout" : "layout"}>
        {!isAuthPage && <Sidebar />}
        <main className={isAuthPage ? "auth-main" : "main-content"}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
            <Route path="/timetracker" element={<ProtectedRoute><TimeTracker /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}