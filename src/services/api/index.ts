import axios from 'axios';

// Base URL configuration
const API_BASE_URL = import.meta.env.MODE === 'development'
  ? '/api' // Use Vite proxy in development
  : import.meta.env.VITE_API_BASE_URL || 'https://maziv-project-management.onrender.com/api';

// Log environment for debugging
console.log('API Configuration:', {
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  apiBaseUrl: API_BASE_URL,
  viteApiUrl: import.meta.env.VITE_API_URL,
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or your auth store)
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });

      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized (e.g., token expired)
        console.warn('Authentication required');
      } else if (error.response.status === 403) {
        // Handle forbidden
        console.warn('Access denied');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export { api };

// Add a response interceptor to handle 401 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      console.error('Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('[API Response Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        requestData: error.config?.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API No Response]', {
        url: error.config?.url,
        method: error.config?.method,
        message: 'No response received from server',
      });
    } else {
      // Something happened in setting up the request
      console.error('[API Request Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);

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
