import { all, fork } from 'redux-saga/effects';
import authSaga from './authSaga';
import projectsSaga from './projectsSaga';
import itemsSaga from './itemsSaga';
import usersSaga from './usersSaga';
import reportsSaga from './reportsSaga';
import alertsSaga from './alertsSaga';
import notificationsSaga from './notificationsSaga';

export function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(projectsSaga),
    fork(itemsSaga),
    fork(usersSaga),
    fork(reportsSaga),
    fork(alertsSaga),           // ✅
    fork(notificationsSaga),    // ✅
  ]);
}
