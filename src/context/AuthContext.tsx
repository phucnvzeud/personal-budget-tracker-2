import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Setup API base URL - using hardcoded value that we know works
const API_URL = 'http://localhost:8080';

// Token storage key
const TOKEN_STORAGE_KEY = 'budget-tracker-token';
const USER_STORAGE_KEY = 'budget-tracker-user';

// Add the token to all axios requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On init, check for saved token and user
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Save user and token data when they change
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [currentUser, token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('Making login API request to:', `${API_URL}/api/auth/login`);
      console.log('Login credentials (email only):', email);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      console.log('Login response received:', response.status);
      
      const { token, user } = response.data;
      console.log('Login successful for user:', user.username);
      
      setToken(token);
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email
      });
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      
      setLoading(false);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('Making registration API request to:', `${API_URL}/api/auth/register`);
      const response = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
      console.log('Registration response:', response.data);
      
      const { token, user } = response.data;
      
      setToken(token);
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email
      });
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser && !!token,
        login,
        register,
        logout,
        loading,
        token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 