import { call, put, takeEvery } from 'redux-saga/effects';
import { fetchAlertsStart, fetchAlertsSuccess, fetchAlertsFailure } from '../slices/alertsSlice';
import { getUserAlerts } from '../../services/api/users';
import { PayloadAction } from '@reduxjs/toolkit';

function* fetchAlertsSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const userId = action.payload;
    const response = yield call(getUserAlerts, userId);
    yield put(fetchAlertsSuccess(response.data.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
    yield put(fetchAlertsFailure(message));
  }
}

export default function* alertsSaga() {
  yield takeEvery(fetchAlertsStart.type, fetchAlertsSaga);
} 