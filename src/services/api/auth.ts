import api from '../api';

// Login user 
export const login = (credentials: { email: string; password: string }) => {
  console.log('Auth API: login called with:', { email: credentials.email });
  console.log('Auth API: base URL:', api.defaults.baseURL);
  
  return api.post('/auth/login', credentials);
};

// Register user
export const register = (userData: { name: string; email: string; password: string; role?: string }) => {
  console.log('Auth API: register called');
  return api.post('/auth/register', userData);
};

// Get the currently authenticated user
export const getCurrentUser = () => {
  console.log('Auth API: getCurrentUser called');
  return api.get('/auth/me');
};
