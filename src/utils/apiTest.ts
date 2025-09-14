// Utility to test API configuration
export const testApiConnection = async () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com/api';
  const healthEndpoint = '/health';
  const healthUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}${healthEndpoint.replace(/^\//, '')}`
    : `${baseUrl}${healthEndpoint}`;
  
  console.log('Testing API health check at:', healthUrl);
  
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health check response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (response.ok) {
      console.log('Health check successful:', responseData);
      return { 
        success: true, 
        message: 'API is healthy',
        data: responseData,
        status: response.status
      };
    } else {
      console.error('Health check failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      return { 
        success: false, 
        error: `Health check failed: ${response.status} ${response.statusText}`,
        status: response.status,
        details: responseData
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
  const baseUrl = import.meta.env.VITE_API_URL || 'https://maziv-project-management.onrender.com/api';
  const loginUrl = baseUrl.endsWith('/') ? `${baseUrl}auth/login` : `${baseUrl}/auth/login`;
  
  console.log('Testing login endpoint:', loginUrl);
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'StrongPass123!',
      }),
    });
    
    console.log('Login test response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (response.ok) {
      console.log('Login test successful:', responseData);
      return { 
        success: true, 
        message: 'Login test successful',
        data: responseData,
        status: response.status
      };
    } else {
      console.error('Login test failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      return { 
        success: false, 
        error: `Login failed: ${response.status} ${response.statusText}`,
        status: response.status,
        details: responseData
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
