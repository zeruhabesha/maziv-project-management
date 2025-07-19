import { all, fork } from 'redux-saga/effects';
import authSaga from './authSaga';
import projectsSaga from './projectsSaga';
import itemsSaga from './itemsSaga';
import usersSaga from './usersSaga';
import reportsSaga from './reportsSaga'; // Import the new saga

export function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(projectsSaga),
    fork(itemsSaga),
    fork(usersSaga),
    fork(reportsSaga), // Add the new saga here
  ]);
}