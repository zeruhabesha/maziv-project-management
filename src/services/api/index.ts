import axios from 'axios';

// Determine the correct API base URL
const getApiBaseUrl = () => {
  // Get the base URL from environment or use production URL
  let baseUrl = import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com';
  
  // Remove any trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');
  
  // Log the final URL for debugging
  console.log('Using API base URL:', baseUrl);
  return baseUrl;
};

// Create axios instance with default config
// Configure axios instance
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Log the final configuration
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  withCredentials: api.defaults.withCredentials,
  headers: api.defaults.headers
});

// Request interceptor to add auth token and handle request logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure headers are set
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    config.headers['Accept'] = 'application/json';
    
    // Log the full URL being called for debugging
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and logging
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response Success:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    const errorResponse = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message || error.message,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      requestData: error.config?.data,
      responseData: error.response?.data
    };
    
    console.error('API Response Error:', errorResponse);
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      // Only redirect if not already on login page to prevent infinite redirects
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Return a more detailed error
    return Promise.reject({
      ...error,
      response: {
        ...error.response,
        errorMessage: error.response?.data?.message || error.message,
        errorDetails: error.response?.data?.errors || error.response?.data
      }
    });
  }
);

// Default export for backward compatibility
export default api;

export const updateProject = (id: string, projectData: any) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage!');
  }
  return api.put(`/projects/${id}`, projectData);
};
