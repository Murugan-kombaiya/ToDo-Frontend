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
        <div className="sidebar-group">PRODUCTIVITY</div>
        <Link className={`side-link ${isActive('/pomodoro') ? 'active' : ''}`} to="/pomodoro">
          <i className="bi bi-stopwatch me-2" /> Pomodoro Timer
        </Link>
        <div className="sidebar-group">PROJECTS</div>
        <Link className={`side-link ${isActive('/board') ? 'active' : ''}`} to="/board">
          <i className="bi bi-kanban me-2" /> Kanban Board
        </Link>
        <Link className={`side-link ${isActive('/timetracker') ? 'active' : ''}`} to="/timetracker">
          <i className="bi bi-clock me-2" /> Time Tracker
        </Link>
        <Link className={`side-link ${isActive('/goals') ? 'active' : ''}`} to="/goals">
          <i className="bi bi-bullseye me-2" /> Goals
        </Link>
        <Link className={`side-link ${isActive('/habits') ? 'active' : ''}`} to="/habits">
          <i className="bi bi-calendar-check me-2" /> Habits
        </Link>
      </nav>
    </aside>
  );
}
