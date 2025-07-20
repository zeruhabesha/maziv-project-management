import { call, put, takeEvery } from 'redux-saga/effects';
import { fetchAlertsStart, fetchAlertsSuccess, fetchAlertsFailure } from '../slices/alertsSlice';
import { getUserAlerts } from '../../services/api/users';
import { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

function* fetchAlertsSaga(action: PayloadAction<{ userId: string; projectId?: string }>): Generator<any, void, any> {
  try {
    const { userId, projectId } = action.payload;
    // Build the URL with optional project filter
    let url = `/users/${userId}/alerts`;
    if (projectId && projectId !== 'undefined') {
      url += `?project_id=${projectId}`;
    }
    
    const response = yield call(() => api.get(url));
    yield put(fetchAlertsSuccess(response.data.data));
  } catch (error) {
    const err = error as any;
    console.error('Fetch alerts error:', err);
    const message = err?.response?.data?.message || err?.message || 'Failed to fetch alerts';
    yield put(fetchAlertsFailure(message));
  }
}

export default function* alertsSaga() {
  yield takeEvery(fetchAlertsStart.type, fetchAlertsSaga);
} 