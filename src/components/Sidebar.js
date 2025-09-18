import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { pathname } = useLocation();
  const isActive = (to) => pathname === to;
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">S</div>
        <div className="brand-text">Symatis</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-group">OVERVIEW</div>
        <Link className={`side-link ${isActive('/') ? 'active' : ''}`} to="/">Dashboard</Link>
        <Link className={`side-link ${isActive('/analytics') ? 'active' : ''}`} to="#">Analytics</Link>
        <div className="sidebar-group">PROJECTS</div>
        <Link className={`side-link ${isActive('/board') ? 'active' : ''}`} to="/board">Tasks</Link>
        <div className="sidebar-group">REPORTS</div>
        <Link className={`side-link ${isActive('/time-logs') ? 'active' : ''}`} to="#">Time Logs</Link>
        <Link className={`side-link ${isActive('/leave') ? 'active' : ''}`} to="#">Leave Calendar</Link>
      </nav>
    </aside>
  );
}
