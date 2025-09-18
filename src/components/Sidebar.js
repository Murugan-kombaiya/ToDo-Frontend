import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { pathname } = useLocation();
  const isActive = (to) => pathname === to;
  return (
    <aside className="sidebar enhanced">
      <div className="sidebar-brand">
        <div className="logo logo-animated">S</div>
        <div className="brand-text">Symatis</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-group">OVERVIEW</div>
        <Link className={`side-link ${isActive('/') ? 'active' : ''}`} to="/">
          <i className="bi bi-speedometer2 me-2" /> Dashboard
        </Link>
        <Link className={`side-link ${isActive('/analytics') ? 'active' : ''}`} to="#">
          <i className="bi bi-graph-up me-2" /> Analytics
        </Link>
        <div className="sidebar-group">PROJECTS</div>
        <Link className={`side-link ${isActive('/board') ? 'active' : ''}`} to="/board">
          <i className="bi bi-kanban me-2" /> Kanban Board
        </Link>
        <Link className={`side-link ${isActive('/tasks') ? 'active' : ''}`} to="/tasks">
          <i className="bi bi-list-task me-2" /> Task List
        </Link>
        <div className="sidebar-group">REPORTS</div>
        <Link className={`side-link ${isActive('/time-logs') ? 'active' : ''}`} to="#">
          <i className="bi bi-clock-history me-2" /> Time Logs
        </Link>
        <Link className={`side-link ${isActive('/leave') ? 'active' : ''}`} to="#">
          <i className="bi bi-calendar3 me-2" /> Leave Calendar
        </Link>
      </nav>
    </aside>
  );
}
