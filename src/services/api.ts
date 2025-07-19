import axios from 'axios';
import { store } from '../store'; // Ensure the path to your store is correct

const api = axios.create({
  // Use VITE_ instead of REACT_APP_ for Vite projects
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Removed global Content-Type header to allow FormData uploads
});

// Request Interceptor to add the token to every request from the Redux store
api.interceptors.request.use(
  (config) => {
    // Get the token from the Redux store on each request
    const token = store.getState().auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // This will handle errors in the request configuration
    return Promise.reject(error);
  }
);

// FIX: Change from a named export to a default export.
export default api;