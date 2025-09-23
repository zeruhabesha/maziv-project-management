// src/store/sagas/notificationsSaga.ts
import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../lib/api';
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markNotificationReadStart,
  markNotificationReadSuccess,
  markNotificationReadFailure,
} from '../slices/notificationsSlice';

function* fetchNotificationsWorker(action: ReturnType<typeof fetchNotificationsStart>) {
  try {
    const { userId } = action.payload;
    const response = yield call(api.get, `/users/${userId}/notifications`);
    const list = (response as any)?.data?.data || [];
    yield put(fetchNotificationsSuccess(list));
  } catch (err: any) {
    yield put(fetchNotificationsFailure(err?.response?.data?.message || 'Failed to fetch notifications'));
  }
}

function* markNotificationReadWorker(action: ReturnType<typeof markNotificationReadStart>) {
  try {
    const { id } = action.payload;
    // Backend route: POST /api/users/notifications/:notificationId/read
    yield call(api.post, `/users/notifications/${id}/read`);
    yield put(markNotificationReadSuccess({ id }));
  } catch (err: any) {
    yield put(markNotificationReadFailure(err?.response?.data?.message || 'Failed to mark notification read'));
  }
}

export default function* notificationsSaga() {
  yield takeLatest(fetchNotificationsStart.type, fetchNotificationsWorker);
  yield takeLatest(markNotificationReadStart.type, markNotificationReadWorker);
}
