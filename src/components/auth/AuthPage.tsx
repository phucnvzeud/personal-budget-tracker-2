import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Login } from './Login';
import { Register } from './Register';
import { useAuth } from '../../context/AuthContext';
import './AuthForms.css';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-tabs">
          <div
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </div>
          <div
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </div>
        </div>
        
        {isLogin ? (
          <Login onToggleForm={() => setIsLogin(false)} />
        ) : (
          <Register onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}; 