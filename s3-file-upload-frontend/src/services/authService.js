// frontend/src/services/authService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Register new user
 */
export const register = async (email, password, name) => {
  try {
    const response = await api.post('/register', {
      email,
      password,
      name,
    });

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Registration failed'
    );
  }
};

/**
 * Login user
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Login failed'
    );
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to get user info'
    );
  }
};

/**
 * Refresh token
 */
export const refreshToken = async () => {
  try {
    const response = await api.post('/refresh');
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to refresh token'
    );
  }
};

/**
 * Get stored user from localStorage
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get stored token from localStorage
 */
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getStoredToken();
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  getStoredUser,
  getStoredToken,
  isAuthenticated,
};