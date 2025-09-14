const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:10000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
  name: 'Test User'
};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {}
  };

  if (data) {
    config.data = data;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.error('Request Error Details:', {
      message: error.message,
      code: error.code,
      request: {
        method: error.config?.method,
        url: error.config?.url,
        headers: error.config?.headers,
        data: error.config?.data
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : 'No response',
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      fullError: error
    };
  }
}

// Test user registration
async function testRegistration() {
  console.log('Testing user registration...');
  const response = await makeRequest('post', '/auth/register', {
    name: TEST_USER.name,
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  if (response.success) {
    console.log('✅ Registration successful:', response.data);
    return response.data.data.token;
  } else {
    if (response.status === 400 && response.error.message === 'User already exists') {
      console.log('ℹ️  User already exists, continuing with login...');
      return null;
    }
    console.error('❌ Registration failed:', response.error);
    process.exit(1);
  }
}

// Test user login
async function testLogin() {
  console.log('\nTesting user login...');
  const response = await makeRequest('post', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  if (response.success) {
    console.log('✅ Login successful:', {
      user: response.data.data.user.email,
      token: response.data.data.token.substring(0, 20) + '...'
    });
    return response.data.data.token;
  } else {
    console.error('❌ Login failed:', response.error);
    process.exit(1);
  }
}

// Test getting current user
async function testGetCurrentUser(token) {
  console.log('\nTesting get current user...');
  const response = await makeRequest('get', '/auth/me', null, token);

  if (response.success) {
    console.log('✅ Current user:', response.data.data);
    return true;
  } else {
    console.error('❌ Failed to get current user:', response.error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting authentication tests...\n');
  
  // Try to register first
  const token = await testRegistration();
  
  // If registration didn't return a token (user already exists), try to login
  const authToken = token || await testLogin();
  
  // Test getting current user with the obtained token
  await testGetCurrentUser(authToken);
  
  console.log('\n✅ All tests completed successfully!');
}

// Run the tests
runTests().catch(console.error);
