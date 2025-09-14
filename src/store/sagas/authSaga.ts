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
  console.log('loginSaga called with:', action.payload);
  try {
    console.log('Environment:', {
      NODE_ENV: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      API_URL: import.meta.env.VITE_API_URL
    });
    
    const response = yield call(authApi.login, action.payload);
    console.log('Login response received:', response);
    
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    yield put(loginSuccess({ user, token }));
    
    // Fetch notifications after successful login
    if (user?.id) {
      yield put(fetchNotificationsStart({ userId: user.id }));
    }
  } catch (error: any) {
    console.error('Login saga error:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Login failed - please check your connection';
    yield put(loginFailure(errorMessage));
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
    const response = yield call(authApi.getCurrentUser);
    yield put(getCurrentUserSuccess(response.data.data || response.data.user));
  } catch (error: any) {
    console.error('Get current user saga error:', error);
    yield put(getCurrentUserFailure(error.response?.data?.message || 'Failed to get user'));
    localStorage.removeItem('token');
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
