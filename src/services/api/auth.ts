// import { api } from './index';

// export const login = (credentials: { email: string; password: string }) => {
//   return api.post('/auth/login', credentials);
// };

// export const register = (userData: { name: string; email: string; password: string; role?: string }) => {
//   return api.post('/auth/register', userData);
// };

// export const getCurrentUser = () => {
//   return api.get('/auth/me');
// };
import api from '../api'; // This default import now works correctly.

// Login user 
export const login = (credentials: any) => {
  console.log('API: login called with', credentials);
  console.log('API base URL:', api.defaults.baseURL);
  return api.post('/auth/login', credentials);
};

// Register user
export const register = (userData: any) => api.post('/auth/register', userData);

// Get the currently authenticated user
export const getCurrentUser = () => api.get('/auth/me');