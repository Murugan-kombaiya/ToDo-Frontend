import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, authLinks = [] }) => {
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        {children}

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="auth-links">
          {authLinks.map((link, index) => (
            <Link key={index} to={link.to}>
              <i className={`bi ${link.icon}`}></i>
              {link.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;