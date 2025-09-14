import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../lib/api';
import {
  loginStart, loginSuccess, loginFailure,
  getCurrentUserStart, getCurrentUserSuccess, getCurrentUserFailure,
  logout,
  registerStart, registerSuccess, registerFailure
} from '../slices/authSlice';
import { fetchNotificationsStart } from '../slices/notificationsSlice';

function* loginSaga(action: ReturnType<typeof loginStart>): Generator {
  let response: any;
  try {
    const { email, password } = action.payload;
    
    // Make the API call
    response = yield call(api.post, '/auth/login', { email, password });
    
    // Log the full response for debugging
    console.log('Login API Response:', response);
    
    // Extract token and user from the response
    const token = response?.data?.data?.token || response?.data?.token;
    const user = response?.data?.data?.user || response?.data?.user;

    if (!token) {
      console.error('No token in response:', response?.data);
      throw new Error('Authentication failed: No token received');
    }

    if (!user) {
      console.error('No user data in response:', response?.data);
      throw new Error('Authentication failed: User data missing');
    }

    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Update Redux store with user data and token
    yield put(loginSuccess({ user, token }));

    // Fetch notifications if user ID is available
    if (user?.id) {
      yield put(fetchNotificationsStart({ userId: user.id }));
    }
    
    // Refresh user data to ensure consistency
    yield put(getCurrentUserStart());
    
  } catch (err: any) {
    // Handle different types of errors
    let errorMessage = 'Login failed. Please check your credentials and try again.';
    
    if (err?.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = err.response;
      console.error('Login API Error:', { status, data });
      
      if (status === 401) {
        errorMessage = data?.message || 'Invalid email or password';
      } else if (status === 400) {
        errorMessage = data?.message || 'Invalid request data';
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (data?.message) {
        errorMessage = data.message;
      }
    } else if (err?.request) {
      // The request was made but no response was received
      console.error('No response from server:', err.request);
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Login error:', err.message);
      errorMessage = err.message || 'An unexpected error occurred';
    }
    
    // Clear any invalid token
    localStorage.removeItem('token');
    
    // Update the UI with the error message
    yield put(loginFailure(errorMessage));
    
    // Show error toast to the user
    // Note: This assumes you have toast configured in your app
    // You might need to import and use your toast library here
    // toast.error(errorMessage);
  }
}

function* registerSaga(action: ReturnType<typeof registerStart>): Generator {
  let response: any;
  try {
    const { name, email, password, role } = action.payload;
    
    // Make the registration API call
    response = yield call(api.post, '/auth/register', { 
      name, 
      email, 
      password, 
      role: role || 'user' 
    });
    
    // Handle successful registration
    yield put(registerSuccess(response.data));
    
    // Automatically log in after registration
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      yield put(loginSuccess(response.data));
      yield put(getCurrentUserStart());
    }
    
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message ||
                        err?.message ||
                        'Registration failed';
    
    console.error('Registration error:', errorMessage);
    yield put(registerFailure(errorMessage));
  }
}

function* getCurrentUserSaga(): Generator {
  let response: any;
  try {
    // Check if we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping getCurrentUser');
      return;
    }
    
    // Fetch current user data
    response = yield call(api.get, '/auth/me');
    
    // Log full response for debugging
    console.log('Current user response:', response);
    
    // Handle different response formats
    const user = response?.data?.data?.user ?? response?.data?.user ?? response?.data;
    
    if (!user) {
      throw new Error('User data not found in response');
    }
    
    yield put(getCurrentUserSuccess(user));
    
  } catch (err: any) {
    // Clear invalid token on auth errors
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    const errorMessage = err?.response?.data?.message ||
                        err?.message ||
                        'Failed to load user data';
    
    console.error('Failed to fetch current user:', errorMessage);
    yield put(getCurrentUserFailure(errorMessage));
  }
}

function* logoutSaga() {
  try {
    // Get token before removing it
    const token = localStorage.getItem('token');
    
    // Clear auth data
    localStorage.removeItem('token');
    
    // If we have a token, try to call the server-side logout
    if (token) {
      try {
        yield call(api.post, '/auth/logout');
      } catch (err) {
        console.log('Server logout failed (might be expected if already logged out):', err);
      }
    }
    
    // Clear any cached data or perform other cleanup
    // For example, you might want to clear the entire Redux store
    // yield put(resetState());
    
  } catch (err) {
    console.error('Logout error:', err);
    // Even if logout fails, we still want to clear the local state
    localStorage.removeItem('token');
  }
}

function* authSaga() {
  yield takeLatest(loginStart.type, loginSaga);
  yield takeLatest(registerStart.type, registerSaga);
  yield takeLatest(getCurrentUserStart.type, getCurrentUserSaga);
  yield takeLatest(logout.type, logoutSaga);
}

export default authSaga;
