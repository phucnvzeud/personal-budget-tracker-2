import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AuthForms.css';

interface LoginProps {
  onToggleForm: () => void;
}

export const Login: React.FC<LoginProps> = ({ onToggleForm }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError(null);
    const success = await login(email, password);
    
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const handleQuickLogin = async () => {
    console.log('Quick Login clicked - using test credentials');
    setEmail('test@example.com');
    setPassword('password123');
    setError(null);
    
    try {
      console.log('Sending login request to API...');
      // Use direct credentials instead of the state variables which might not have updated yet
      const success = await login('test@example.com', 'password123');
      console.log('Login API response success:', success);
      
      if (!success) {
        console.error('Quick login failed with API success=false');
        setError('Test user login failed. Server might be down.');
      } else {
        console.log('Quick login successful!');
      }
    } catch (error) {
      console.error('Quick login error:', error);
      setError('Error during test login. Check console for details.');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Login to Your Account</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            disabled={loading}
            required
          />
        </div>
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="auth-quick-login">
        <button 
          onClick={handleQuickLogin} 
          className="quick-login-button"
          disabled={loading}
        >
          Quick Login (Test User)
        </button>
      </div>
      
      <div className="auth-switch">
        Don't have an account?{' '}
        <button className="text-button" onClick={onToggleForm} disabled={loading}>
          Register
        </button>
      </div>
    </div>
  );
}; 