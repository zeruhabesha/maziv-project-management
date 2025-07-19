import { call, put, takeEvery } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as usersApi from '../../services/api/users';
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  createUserStart,
  createUserSuccess,
  createUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
} from '../slices/usersSlice';

function* fetchUsersSaga() {
  try {
    const response = yield call(usersApi.getUsers);
    yield put(fetchUsersSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchUsersFailure(error.response?.data?.message || 'Failed to fetch users'));
  }
}

function* createUserSaga(action: PayloadAction<any>) {
  try {
    const response = yield call(usersApi.createUser, action.payload);
    yield put(createUserSuccess(response.data.data));
  } catch (error: any) {
    yield put(createUserFailure(error.response?.data?.message || 'Failed to create user'));
  }
}

function* updateUserSaga(action: PayloadAction<{ id: string; data: any }>) {
  try {
    const response = yield call(usersApi.updateUser, action.payload.id, action.payload.data);
    yield put(updateUserSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateUserFailure(error.response?.data?.message || 'Failed to update user'));
  }
}

function* deleteUserSaga(action: PayloadAction<string>) {
  try {
    yield call(usersApi.deleteUser, action.payload);
    yield put(deleteUserSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteUserFailure(error.response?.data?.message || 'Failed to delete user'));
  }
}

export default function* usersSaga() {
  yield takeEvery(fetchUsersStart.type, fetchUsersSaga);
  yield takeEvery(createUserStart.type, createUserSaga);
  yield takeEvery(updateUserStart.type, updateUserSaga);
  yield takeEvery(deleteUserStart.type, deleteUserSaga);
}