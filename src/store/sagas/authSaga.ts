import { call, put, takeEvery, select } from 'redux-saga/effects';
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
  console.log('loginSaga called with', action);
  try {
    const response = yield call(authApi.login, action.payload);
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    yield put(loginSuccess({ user, token }));
    yield put(fetchNotificationsStart(user.id));
  } catch (error: any) {
    yield put(loginFailure(error.response?.data?.message || 'Login failed'));
  }
}

function* registerSaga(action: PayloadAction<{ name: string; email: string; password: string; role?: string }>): Generator {
  try {
    const response = yield call(authApi.register, action.payload);
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    yield put(registerSuccess({ user, token }));
  } catch (error: any) {
    yield put(registerFailure(error.response?.data?.message || 'Registration failed'));
  }
}

function* getCurrentUserSaga(): Generator {
  try {
    const response = yield call(authApi.getCurrentUser);
    yield put(getCurrentUserSuccess(response.data.user));
  } catch (error: any) {
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