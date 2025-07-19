import { call, put, takeEvery } from 'redux-saga/effects';
import * as reportsApi from '../../services/api/reports';
import {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} from '../slices/reportsSlice';
import toast from 'react-hot-toast';

function* fetchDashboardSaga(): Generator {
  try {
    const response: any = yield call(reportsApi.getDashboardReport);
    yield put(fetchDashboardSuccess(response.data.data));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch dashboard data';
    yield put(fetchDashboardFailure(message));
    toast.error(message);
  }
}

export default function* reportsSaga() {
  yield takeEvery(fetchDashboardStart.type, fetchDashboardSaga);
}