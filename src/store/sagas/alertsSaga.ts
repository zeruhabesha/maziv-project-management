// src/store/sagas/alertsSaga.ts
import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../lib/api';
import { fetchAlertsStart, fetchAlertsSuccess, fetchAlertsFailure } from '../slices/alertsSlice';

function* fetchAlertsWorker(action: ReturnType<typeof fetchAlertsStart>) {
  try {
    const { userId } = action.payload;
    const { data } = yield call(api.get, `/users/${userId}/alerts`);
    yield put(fetchAlertsSuccess(data || []));
  } catch (err: any) {
    yield put(fetchAlertsFailure(err?.response?.data?.message || 'Failed to fetch alerts'));
  }
}

export default function* alertsSaga() {
  yield takeLatest(fetchAlertsStart.type, fetchAlertsWorker);
}
