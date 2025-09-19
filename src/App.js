import React from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Sidebar from "./components/Sidebar";
import RouteChangeLoader from "./components/RouteChangeLoader.jsx";
import RealtimeEvents from "./components/RealtimeEvents.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Header() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');

  React.useEffect(() => {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Cleanup any previous fullwidth preference and class
  React.useEffect(() => {
    document.body.classList.remove('fullwidth');
    document.body.classList.remove('compact');
    try { localStorage.removeItem('fullwidth'); } catch (_) {}
    try { localStorage.removeItem('density'); } catch (_) {}
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };
  return (
    <div className="navbar">
      <div className="nav-inner">
        <Link className="brand" to="/">📝 Todo</Link>
        <div className="muted" style={{marginLeft:10}}>
          {new Date().toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'})}
        </div>
        <div className="nav-actions">
          <Link to="/board" style={{marginRight:10}}>Kanban</Link>
          <Link to="/tasks" style={{marginRight:10}}>List</Link>
          <button className="btn btn-outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{marginRight:10}}>
            {theme === 'dark' ? 'Light' : 'Dark'} mode
          </button>
          <a href="/#quick-add" className="btn btn-primary" style={{marginRight:10}}>+ Quick Add</a>
          {username ? (
            <>
              <span style={{marginRight:10}}>Hello, {username}</span>
              <button className="btn btn-danger" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/register" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot'].includes(location.pathname);

  return (
    <>
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
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot" element={<PublicRoute><Forgot /></PublicRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
