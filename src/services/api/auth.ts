import api from '../api';

// Login user 
export const login = async (credentials: { email: string; password: string }) => {
  try {
    console.log('Auth API: login called with email:', credentials.email);
    console.log('Auth API: baseURL:', api.defaults.baseURL);
    
    const response = await api.post('/auth/login', credentials);
    console.log('Auth API: login successful');
    return response;
  } catch (error: any) {
    console.error('Auth API: login failed:', {
      message: error?.message || 'Unknown error',
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url
    });
    throw error;
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
