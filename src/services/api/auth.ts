import { api } from '../../lib/api';

/**
 * Login a user with email and password
 * @param credentials User credentials (email and password)
 * @returns User data and auth token
 * @throws Error with response data if login fails
 */
export const login = async (credentials: { email: string; password: string }) => {
  const endpoint = '/auth/login';
  
  // Log request details in development
  if (import.meta.env.DEV) {
    console.log('Auth API - Login Request:', {
      endpoint,
      baseURL: api.defaults.baseURL,
      environment: import.meta.env.MODE,
      timeout: api.defaults.timeout
    });
  }
  
  try {
    const response = await api.post(endpoint, credentials);
    
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('Auth API - Login Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    
    // Handle different response formats
    const token = response.data?.data?.token || response.data?.token;
    const user = response.data?.data?.user || response.data?.user;
    
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return response.data;
  } catch (error: any) {
    // Handle timeout errors specifically
    if (error.isTimeout) {
      console.error('Auth API: Login timeout');
      throw new Error('Login request timed out. Please check your connection and try again.');
    }
    
    // Handle network errors
    if (error.isNetworkError) {
      console.error('Auth API: Network error during login');
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
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
