// Utility to test API configuration
export const testApiConnection = async () => {
  // Ensure base URL doesn't end with /api to prevent double /api in the path
  let baseUrl = import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com';
  baseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove any trailing /api
  
  const healthEndpoint = '/api/health';
  const healthUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}${healthEndpoint.replace(/^\//, '')}`
    : `${baseUrl}${healthEndpoint}`;
  
  console.log('Testing API health check at:', healthUrl);
  
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: 'include' // Important for cookies/auth
    });
    
    const responseData = await response.json().catch(() => ({
      error: 'Invalid JSON response',
      status: 'unknown'
    }));
    
    console.log('Health check response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok,
      data: responseData
    });
    
    if (response.ok) {
      return { 
        success: true, 
        message: 'API is healthy',
        data: responseData,
        status: response.status,
        url: response.url
      };
    } else {
      const errorMessage = responseData?.error || response.statusText || 'Unknown error';
      console.error('Health check failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: responseData
      });
      return { 
        success: false, 
        error: `Health check failed: ${response.status} ${errorMessage}`,
        status: response.status,
        details: responseData,
        url: response.url
      };
    }
  } catch (error: any) {
    console.error('Health check error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during health check',
      details: error
    };
  }
};

// Test login endpoint specifically
export const testLoginEndpoint = async () => {
  // Use the same base URL logic as the API client
  let baseUrl = import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com';
  baseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove any trailing /api
  
  const loginUrl = `${baseUrl}/api/auth/login`;
  
  console.log('Testing login endpoint:', loginUrl);
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'testuser2@example.com', // Updated to match the working test user
        password: 'TestPass123!',       // Updated to match the working test user
      }),
    });
    
    const responseData = await response.json().catch(() => ({
      error: 'Invalid JSON response',
      status: 'unknown'
    }));
    
    console.log('Login test response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok,
      data: responseData
    });
    
    if (response.ok) {
      console.log('Login test successful:', responseData);
      return { 
        success: true, 
        message: 'Login test successful',
        data: responseData,
        status: response.status,
        url: response.url
      };
    } else {
      const errorMessage = responseData?.error || response.statusText || 'Unknown error';
      console.error('Login test failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: responseData
      });
      return { 
        success: false, 
        error: `Login failed: ${response.status} ${errorMessage}`,
        status: response.status,
        details: responseData,
        url: response.url
      };
    }
  } catch (error: any) {
    console.error('Login test error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during login test',
      details: error
    };
  }
};
