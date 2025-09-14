import api from '../api';

// Login user 
export const login = async (credentials: { email: string; password: string }) => {
  // Ensure the endpoint starts with a forward slash but doesn't have /api prefix (it's already in baseURL)
  const endpoint = '/auth/login';
  const fullUrl = `${api.defaults.baseURL}${endpoint}`;
  
  console.log('Auth API: login request:', {
    url: fullUrl,
    email: credentials.email,
    baseURL: api.defaults.baseURL,
    withCredentials: api.defaults.withCredentials,
    env: {
      NODE_ENV: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      VITE_API_URL: import.meta.env.VITE_API_URL
    }
  });
  
  try {
    const response = await api.post(endpoint, credentials, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'  // Helps with CORS
      },
      withCredentials: true,
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('Auth API: login response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        baseURL: response.config.baseURL,
        method: response.config.method
      }
    });
    
    if (response.status >= 400) {
      const error = new Error(response.data?.message || 'Login failed');
      (error as any).response = response;
      throw error;
    }
    
    return response;
  } catch (error: any) {
    const errorInfo = {
      message: error?.message || 'Unknown error',
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method,
      requestData: error?.config?.data,
      headers: error?.config?.headers
    };
    
    console.error('Auth API: login failed:', errorInfo);
    
    // Create a more informative error
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Login failed';
    
    const loginError = new Error(errorMessage);
    (loginError as any).status = error.response?.status;
    (loginError as any).data = error.response?.data;
    
    throw loginError;
  }
};

// Register user
export const register = async (userData: { name: string; email: string; password: string; role?: string }) => {
  try {
    console.log('Auth API: register called for email:', userData.email);
    const response = await api.post('/auth/register', userData);
    console.log('Auth API: registration successful');
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
      
    const errorResponse = (error as any)?.response;
    
    console.error('Auth API: registration failed:', {
      message: errorMessage,
      status: errorResponse?.status,
      data: errorResponse?.data
    });
    
    // Re-throw with a more specific error type if needed
    const registrationError = new Error(errorMessage);
    (registrationError as any).status = errorResponse?.status;
    (registrationError as any).data = errorResponse?.data;
    throw registrationError;
  }
};

// Get the currently authenticated user
export const getCurrentUser = async () => {
  try {
    console.log('Auth API: getCurrentUser called');
    const response = await api.get('/auth/me');
    console.log('Auth API: getCurrentUser successful');
    return response;
  } catch (error: any) {
    console.error('Auth API: getCurrentUser failed:', {
      message: error?.message || 'Unknown error',
      status: error?.response?.status
    });
    throw error;
  }
};
