import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const isActive = (to) => pathname === to;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, onClose]);

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar enhanced mobile-responsive ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="sidebar-brand">
        <div className="logo logo-animated">T</div>
        <div className="brand-text">TaskFlow</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-group">OVERVIEW</div>
        <Link className={`side-link ${isActive('/') ? 'active' : ''}`} to="/" onClick={handleLinkClick}>
          <i className="bi bi-speedometer2 me-2 mobile-only" />Dashboard
        </Link>
        <Link className={`side-link ${isActive('/analytics') ? 'active' : ''}`} to="/analytics" onClick={handleLinkClick}>
          <i className="bi bi-graph-up me-2 mobile-only" />Analytics
        </Link>
        <div className="sidebar-group">PRODUCTIVITY</div>
        <Link className={`side-link ${isActive('/pomodoro') ? 'active' : ''}`} to="/pomodoro" onClick={handleLinkClick}>
          <i className="bi bi-stopwatch me-2 mobile-only" />Pomodoro Timer
        </Link>
        <div className="sidebar-group">PROJECTS</div>
        <Link className={`side-link ${isActive('/board') ? 'active' : ''}`} to="/board" onClick={handleLinkClick}>
          <i className="bi bi-kanban me-2 mobile-only" />Kanban Board
        </Link>
        <Link className={`side-link ${isActive('/prs') ? 'active' : ''}`} to="/prs" onClick={handleLinkClick}>
          <i className="bi bi-git me-2 mobile-only" />PR Management
        </Link>
        <Link className={`side-link ${isActive('/timetracker') ? 'active' : ''}`} to="/timetracker" onClick={handleLinkClick}>
          <i className="bi bi-clock me-2 mobile-only" />Time Tracker
        </Link>
        <Link className={`side-link ${isActive('/habits') ? 'active' : ''}`} to="/habits" onClick={handleLinkClick}>
          <i className="bi bi-calendar-check me-2 mobile-only" />Habits
        </Link>

        <div className="sidebar-group">LEARNING</div>
        <Link className={`side-link ${isActive('/learning') ? 'active' : ''}`} to="/learning" onClick={handleLinkClick}>
          <i className="bi bi-mortarboard me-2 mobile-only" />Learning Progress
        </Link>
        <Link className={`side-link ${isActive('/notes') ? 'active' : ''}`} to="/notes" onClick={handleLinkClick}>
          <i className="bi bi-journal-text me-2 mobile-only" />Notes
        </Link>
        <Link className={`side-link ${isActive('/sessions') ? 'active' : ''}`} to="/sessions" onClick={handleLinkClick}>
          <i className="bi bi-clock-history me-2 mobile-only" />Study Sessions
        </Link>
        <Link className={`side-link ${isActive('/daily-goals') ? 'active' : ''}`} to="/daily-goals" onClick={handleLinkClick}>
          <i className="bi bi-target me-2 mobile-only" />Daily Goals
        </Link>

        <div className="sidebar-group">ACCOUNT</div>
        <Link className={`side-link ${isActive('/profile') ? 'active' : ''}`} to="/profile" onClick={handleLinkClick}>
          <i className="bi bi-person-circle me-2 mobile-only" />Profile
        </Link>
      </nav>
    </aside>
    </>
  );
}
