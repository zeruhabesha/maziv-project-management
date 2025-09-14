import axios from 'axios';

// Get the base URL for API requests
const getApiBaseUrl = () => {
  // In production, always use the Render backend URL
  if (import.meta.env.PROD) {
    return 'https://maziv-project-management.onrender.com/api';
  }
  
  // In development, use the Vite proxy if available, otherwise use the full URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
  
  // Ensure we have the full URL with protocol
  let url = baseUrl.startsWith('http') ? baseUrl : `http://${baseUrl}`;
  
  // Ensure we have the /api prefix
  if (!url.endsWith('/api')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }
  
  // Remove any double slashes
  url = url.replace(/([^:]\/)\/+/g, '$1');
  
  // Log the final URL for debugging
  console.log('Using API base URL:', url);
  return url;
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Important for cookies/auth
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Add request interceptor to ensure consistent URL formatting
api.interceptors.request.use(config => {
  // Remove any double slashes that might occur in the URL
  if (config.url) {
    config.url = config.url.replace(/([^:]\/)\/+/g, '$1');
  }
  return config;
});

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
