import api from './api';
import { jwtDecode } from 'jwt-decode';

export const login = async (username, password) => {
  try {
    const response = await api.post('/token/', { username, password });
    const { access, refresh, role } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_role', role);
    return { success: true, role };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || 'Login failed' };
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    if (Date.now() >= decoded.exp * 1000) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getUserRole = () => {
  return localStorage.getItem('user_role');
};