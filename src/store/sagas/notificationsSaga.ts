// src/store/sagas/notificationsSaga.ts
import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../services/api';
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
    const { data } = yield call(api.get, `/users/${userId}/notifications`);
    yield put(fetchNotificationsSuccess(data || []));
  } catch (err: any) {
    yield put(fetchNotificationsFailure(err?.response?.data?.message || 'Failed to fetch notifications'));
  }
}

function* markNotificationReadWorker(action: ReturnType<typeof markNotificationReadStart>) {
  try {
    const { id } = action.payload;
    yield call(api.patch, `/notifications/${id}/read`); // backend should flip is_read=true
    yield put(markNotificationReadSuccess({ id }));
  } catch (err: any) {
    yield put(markNotificationReadFailure(err?.response?.data?.message || 'Failed to mark notification read'));
  }
}

export default function* notificationsSaga() {
  yield takeLatest(fetchNotificationsStart.type, fetchNotificationsWorker);
  yield takeLatest(markNotificationReadStart.type, markNotificationReadWorker);
}
