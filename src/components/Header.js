import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Header({ onToggleSidebar, sidebarOpen }) {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // toggleTheme is now coming from useTheme hook

  const toggleSidebar = () => {
    onToggleSidebar?.();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Theme is now managed by ThemeContext

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.navbar') && !event.target.closest('.mobile-menu')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="navbar modern-header ultra-modern glassmorphism" role="banner">
        <div className="nav-container modern-container ultra-modern">
          {/* Left Section - Logo */}
          <div className="nav-left ultra-modern">
            <button
              className="sidebar-toggle ultra-modern mobile-only"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <i className="bi bi-list"></i>
            </button>
            <Link className="brand-logo modern-brand ultra-modern" to="/" aria-label="TaskFlow Pro Home">
              <div className="logo-container ultra-modern">
                <div className="logo-icon ultra-modern">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="brand-content ultra-modern">
                  <span className="logo-text ultra-modern">TaskFlow</span>
                  <span className="logo-subtitle ultra-modern">Pro</span>
                </div>
              </div>
            </Link>
          </div>


          {/* Right Section - User Actions */}
          <div className="nav-right modern-actions ultra-modern">
            <button
              className="theme-toggle-btn ultra-modern"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
            </button>

            {username ? (
              <div className="user-section ultra-modern">
                <div className="user-profile ultra-modern">
                  <div className="user-avatar ultra-modern">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="user-details ultra-modern desktop-only">
                    <span className="user-name ultra-modern">{username}</span>
                    <span className="user-status ultra-modern">Online</span>
                  </div>
                </div>
                <button className="logout-btn modern-btn ultra-modern" onClick={logout}>
                  <i className="bi bi-box-arrow-right"></i>
                  <span className="desktop-only">Logout</span>
                </button>
              </div>
            ) : (
              <div className="auth-section modern-auth ultra-modern">
                <Link to="/login" className="auth-btn login-btn modern-btn ultra-modern">
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Login</span>
                </Link>
                <Link to="/register" className="auth-btn register-btn modern-btn ultra-modern primary">
                  <i className="bi bi-person-plus"></i>
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              className={`hamburger-btn ultra-modern mobile-only ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line ultra-modern"></span>
              <span className="hamburger-line ultra-modern"></span>
              <span className="hamburger-line ultra-modern"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/dashboard" className="mobile-menu-item" onClick={closeMobileMenu}>
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </Link>
          <Link to="/tasks" className="mobile-menu-item" onClick={closeMobileMenu}>
            <i className="bi bi-check2-square"></i>
            <span>Tasks</span>
          </Link>
          <Link to="/projects" className="mobile-menu-item" onClick={closeMobileMenu}>
            <i className="bi bi-folder"></i>
            <span>Projects</span>
          </Link>

          {!username && (
            <>
              <div className="mobile-menu-divider"></div>
              <Link to="/login" className="mobile-menu-item" onClick={closeMobileMenu}>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Login</span>
              </Link>
              <Link to="/register" className="mobile-menu-item" onClick={closeMobileMenu}>
                <i className="bi bi-person-plus"></i>
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlays */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu}></div>
    </>
  );
}

export default Header;