import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { pathname } = useLocation();
  const isActive = (to) => pathname === to;
  return (
    <aside className="sidebar enhanced">
      <div className="sidebar-brand">
        <div className="logo logo-animated">T</div>
        <div className="brand-text">TaskFlow</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-group">OVERVIEW</div>
        <Link className={`side-link ${isActive('/') ? 'active' : ''}`} to="/">
          <i className="bi bi-speedometer2 me-2" /> Dashboard
        </Link>
        <Link className={`side-link ${isActive('/analytics') ? 'active' : ''}`} to="/analytics">
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
        <Link className={`side-link ${isActive('/prs') ? 'active' : ''}`} to="/prs">
          <i className="bi bi-git me-2" /> PR Management
        </Link>
        <Link className={`side-link ${isActive('/timetracker') ? 'active' : ''}`} to="/timetracker">
          <i className="bi bi-clock me-2" /> Time Tracker
        </Link>
        <Link className={`side-link ${isActive('/habits') ? 'active' : ''}`} to="/habits">
          <i className="bi bi-calendar-check me-2" /> Habits
        </Link>

        <div className="sidebar-group">LEARNING</div>
        <Link className={`side-link ${isActive('/learning') ? 'active' : ''}`} to="/learning">
          <i className="bi bi-mortarboard me-2" /> Learning Progress
        </Link>
        <Link className={`side-link ${isActive('/notes') ? 'active' : ''}`} to="/notes">
          <i className="bi bi-journal-text me-2" /> Notes
        </Link>
        <Link className={`side-link ${isActive('/sessions') ? 'active' : ''}`} to="/sessions">
          <i className="bi bi-clock-history me-2" /> Study Sessions
        </Link>
        <Link className={`side-link ${isActive('/daily-goals') ? 'active' : ''}`} to="/daily-goals">
          <i className="bi bi-target me-2" /> Daily Goals
        </Link>

        <div className="sidebar-group">ACCOUNT</div>
        <Link className={`side-link ${isActive('/profile') ? 'active' : ''}`} to="/profile">
          <i className="bi bi-person-circle me-2" /> Profile
        </Link>
      </nav>
    </aside>
  );
}
