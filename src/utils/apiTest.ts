// Utility to test API configuration
export const testApiConnection = async () => {
  const baseUrl = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com/api')
    : '/api';
    
  console.log('Testing API connection to:', baseUrl);
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health check response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Health check data:', data);
      return { success: true, data };
    } else {
      console.error('Health check failed:', response.status, response.statusText);
      return { success: false, error: `${response.status} ${response.statusText}` };
    }
  } catch (error) {
    console.error('Health check error:', error);
    return { success: false, error: error.message };
  }
};

// Test login endpoint specifically
export const testLoginEndpoint = async () => {
  const baseUrl = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com/api')
    : '/api';
    
  const loginUrl = `${baseUrl}/auth/login`;
  console.log('Testing login endpoint:', loginUrl);
  
  try {
    // Just test if the endpoint exists (should return 400 for missing credentials)
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body should trigger validation error
    });
    
    console.log('Login endpoint test:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    
    return { 
      success: response.status !== 404, // 404 means endpoint doesn't exist
      status: response.status,
      url: response.url
    };
  } catch (error) {
    console.error('Login endpoint test error:', error);
    return { success: false, error: error.message };
  }
};
