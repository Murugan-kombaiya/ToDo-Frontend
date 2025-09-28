import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Header() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // toggleTheme is now coming from useTheme hook

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
      <header className="navbar modern-header" role="banner">
        <div className="nav-container">
          {/* Left Section - Logo */}
          <div className="nav-left">
            <button
              className="sidebar-toggle mobile-only"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <i className="bi bi-list"></i>
            </button>
            <Link className="brand-logo" to="/" aria-label="TaskFlow Pro Home">
              <span className="logo-icon">🚀</span>
              <span className="logo-text">TaskFlow Pro</span>
            </Link>
          </div>

          {/* Center Section - Navigation Menu */}
          <nav className="nav-center desktop-only" role="navigation" aria-label="Main navigation">
            <Link to="/dashboard" className="nav-item">
              <i className="bi bi-house-door"></i>
              <span>Dashboard</span>
            </Link>
            <Link to="/tasks" className="nav-item">
              <i className="bi bi-check2-square"></i>
              <span>Tasks</span>
            </Link>
            <Link to="/projects" className="nav-item">
              <i className="bi bi-folder"></i>
              <span>Projects</span>
            </Link>
          </nav>

          {/* Right Section - User Actions */}
          <div className="nav-right">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
            </button>

            {username ? (
              <>
                <div className="user-info desktop-only">
                  <i className="bi bi-person-circle"></i>
                  <span className="username-text">{username}</span>
                </div>
                <button className="logout-btn" onClick={logout}>
                  <i className="bi bi-box-arrow-right"></i>
                  <span className="desktop-only">Logout</span>
                </button>
              </>
            ) : (
              <div className="auth-section">
                <Link to="/login" className="auth-btn login-btn">
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Login</span>
                </Link>
                <Link to="/register" className="auth-btn register-btn">
                  <i className="bi bi-person-plus"></i>
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              className={`hamburger-btn mobile-only ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
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