import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||                 // <-- use env when provided
  (import.meta.env.MODE === 'development'
    ? '/api'                                      // vite proxy in dev
    : 'https://maziv-project-management.onrender.com/api'); // prod fallback

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Removed global Content-Type header to allow FormData uploads
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const updateProject = (id: string, projectData: any) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage!');
  }
  return api.put(`/projects/${id}`, projectData);
};