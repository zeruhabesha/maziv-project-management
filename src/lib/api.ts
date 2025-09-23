import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Log environment info for debugging
console.log('API Environment:', {
  mode: import.meta.env.MODE,
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
});

const API_BASE_URL = (
  import.meta.env.MODE === 'development' 
    ? '/api'  // Use proxy in development
    : 'https://maziv-project-management.onrender.com/api'
);

console.log('Using API Base URL:', API_BASE_URL);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Increase timeout to 30 seconds
  withCredentials: true, // Set to true to align with backend CORS
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers exist and set the Authorization header
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details in development
    if (import.meta.env.DEV) {
      console.group('API Request');
      console.log('Method:', config.method?.toUpperCase());
      console.log('URL:', config.url);
      console.log('Full URL:', `${config.baseURL}${config.url}`);
      console.log('Headers:', config.headers);
      if (config.data) console.log('Data:', config.data);
      console.groupEnd();
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response details in development
    if (import.meta.env.DEV) {
      console.group('API Response');
      console.log('Status:', response.status, response.statusText);
      console.log('URL:', response.config.url);
      console.log('Data:', response.data);
      console.groupEnd();
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject({
          message: 'Request timeout: The server is taking too long to respond. Please try again.',
          isNetworkError: true,
          isTimeout: true
        });
      }
      
      return Promise.reject({
        message: 'Network Error: Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true
      });
    }
    
    // Log error response details
    const { status, data } = error.response;
    console.error('API Error Response:', {
      status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: data,
      headers: error.config?.headers,
    });
    
    // Handle specific error statuses
    if (status === 401) {
      // Auto logout if 401 response returned from API
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Return a consistent error format
    return Promise.reject({
      status,
      message: (data as any)?.message || error.message,
      data: (data as any)?.data || data,
    });
  }
);

export default api;