import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>{title}</h1>
        
        {isAuthenticated && currentUser ? (
          <div className="user-profile">
            <button
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="avatar">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="username">{currentUser.username}</span>
            </button>
            
            {showDropdown && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="dropdown-username">{currentUser.username}</div>
                  <div className="dropdown-email">{currentUser.email}</div>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <a href="/auth" className="auth-link login">
              Login
            </a>
            <a href="/auth" className="auth-link register">
              Register
            </a>
          </div>
        )}
      </div>
    </header>
  );
}; 