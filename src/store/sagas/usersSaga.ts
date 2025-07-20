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
import { changeUserPassword } from '../../services/api/users';
import toast from 'react-hot-toast';

function* fetchUsersSaga(): Generator {
  try {
    const response = yield call(usersApi.getUsers);
    yield put(fetchUsersSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchUsersFailure(error.response?.data?.message || 'Failed to fetch users'));
  }
}

function* createUserSaga(action: PayloadAction<any>): Generator {
  try {
    const response = yield call(usersApi.createUser, action.payload);
    yield put(createUserSuccess(response.data.data));
  } catch (error: any) {
    yield put(createUserFailure(error.response?.data?.message || 'Failed to create user'));
  }
}

function* updateUserSaga(action: PayloadAction<{ id: string; data: any }>): Generator {
  try {
    const response = yield call(usersApi.updateUser, action.payload.id, action.payload.data);
    yield put(updateUserSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateUserFailure(error.response?.data?.message || 'Failed to update user'));
  }
}

function* deleteUserSaga(action: PayloadAction<string>): Generator {
  try {
    yield call(usersApi.deleteUser, action.payload);
    yield put(deleteUserSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteUserFailure(error.response?.data?.message || 'Failed to delete user'));
  }
}

function* changePasswordSaga(action: PayloadAction<{ id: string; data: { currentPassword: string; newPassword: string } }>): Generator {
  try {
    yield call(changeUserPassword, action.payload.id, action.payload.data);
    toast.success('Password updated successfully');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to update password');
  }
}

export default function* usersSaga() {
  yield takeEvery(fetchUsersStart.type, fetchUsersSaga);
  yield takeEvery(createUserStart.type, createUserSaga);
  yield takeEvery(updateUserStart.type, updateUserSaga);
  yield takeEvery(deleteUserStart.type, deleteUserSaga);
  yield takeEvery('users/changePasswordStart', changePasswordSaga);
}