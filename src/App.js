import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import "./App.css";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";

function Header() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };
  return (
    <div style={{maxWidth:500, margin:'10px auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div><Link to="/">Home</Link></div>
      <div>
        {username ? (
          <>
            <span style={{marginRight:10}}>Hello, {username}</span>
            <button className="delete-btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <span> · </span>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
