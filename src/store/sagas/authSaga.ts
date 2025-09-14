import { call, put, takeEvery } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '../../services/api/auth';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  getCurrentUserStart,
  getCurrentUserSuccess,
  getCurrentUserFailure,
  logout
} from '../slices/authSlice';

import { fetchNotificationsStart } from '../slices/notificationsSlice';

function* loginSaga(action: PayloadAction<{ email: string; password: string }>): Generator {
  console.log('loginSaga called with email:', action.payload.email);
  
  try {
    // Log environment info for debugging
    const envInfo = {
      NODE_ENV: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      location: window.location.href,
      timestamp: new Date().toISOString(),
      apiBaseURL: (window as any).api?.defaults?.baseURL
    };
    console.log('Login Environment:', envInfo);
    
    // Make the API call with detailed error handling
    const response: any = yield call(authApi.login, action.payload);
    
    console.log('Login API Response:', {
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      headers: response?.headers
    });
    
    if (!response || !response.data) {
      console.error('Invalid response from server:', response);
      throw new Error('Invalid response from server');
    }
    
    // Handle the response structure from the API
    // Expected structure: { success: true, data: { user: {...}, token: '...' } }
    if (!response.data.success || !response.data.data) {
      console.error('Invalid response structure:', response.data);
      throw new Error('Invalid response from server');
    }
    
    const { user, token } = response.data.data;
    
    if (!user || !token) {
      console.error('Missing user or token in response:', response.data);
      throw new Error('Incomplete response from server');
    }
    
    if (!token) {
      console.error('No authentication token received in response:', response.data);
      throw new Error('No authentication token received');
    }
    
    // Store token and update state
    console.log('Storing token and updating auth state');
    localStorage.setItem('token', token);
    yield put(loginSuccess({ user, token }));
    
    // Fetch notifications after successful login
    if (user?.id) {
      yield put(fetchNotificationsStart({ userId: user.id }));
    }
    
  } catch (error: any) {
    const errorDetails = {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data,
      responseData: error.response?.data,
      stack: error.stack
    };
    
    console.error('Login saga error:', JSON.stringify(errorDetails, null, 2));
    
    // Determine user-friendly error message
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    }
    
    yield put(loginFailure(errorMessage));
    
    // If it's a network error, try to refresh the page once
    if (error.message === 'Network Error' && !localStorage.getItem('retryLogin')) {
      localStorage.setItem('retryLogin', 'true');
      window.location.reload();
    }
  } finally {
    localStorage.removeItem('retryLogin');
  }
}

function* registerSaga(action: PayloadAction<{ name: string; email: string; password: string; role?: string }>): Generator {
  try {
    const response = yield call(authApi.register, action.payload);
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    yield put(registerSuccess({ user, token }));
  } catch (error: any) {
    console.error('Register saga error:', error);
    yield put(registerFailure(error.response?.data?.message || 'Registration failed'));
  }
}

function* getCurrentUserSaga(): Generator {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = yield call(authApi.getCurrentUser);
    
    if (!response || !response.data) {
      throw new Error('Invalid response from server');
    }
    
    const userData = response.data.data || response.data.user || response.data;
    
    if (!userData) {
      throw new Error('No user data received');
    }
    
    yield put(getCurrentUserSuccess(userData));
    
  } catch (error: any) {
    console.error('Get current user saga error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      response: error.response?.data
    });
    
    // Only remove token and redirect if it's an auth error
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    yield put(getCurrentUserFailure(
      error.response?.data?.message || 
      'Failed to load user data. Please log in again.'
    ));
  }
}

function* logoutSaga() {
  localStorage.removeItem('token');
}

export default function* authSaga() {
  yield takeEvery(loginStart.type, loginSaga);
  yield takeEvery(registerStart.type, registerSaga);
  yield takeEvery(getCurrentUserStart.type, getCurrentUserSaga);
  yield takeEvery(logout.type, logoutSaga);
}
