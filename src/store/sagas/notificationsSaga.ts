import { call, put, takeEvery } from 'redux-saga/effects';
import api from '../../services/api'; // or your api instance
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
} from '../slices/notificationsSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* fetchNotificationsSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const userId = action.payload;
    const response = yield call(() => api.get(`/users/${userId}/notifications`));
    yield put(fetchNotificationsSuccess(response.data.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    yield put(fetchNotificationsFailure(message));
  }
}

export default function* notificationsSaga() {
  yield takeEvery(fetchNotificationsStart.type, fetchNotificationsSaga);
}
