import { call, put, takeEvery } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as projectsApi from '../../services/api/projects';
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  fetchProjectStart,
  fetchProjectSuccess,
  fetchProjectFailure,
  createProjectStart,
  createProjectSuccess,
  createProjectFailure,
  updateProjectStart,
  updateProjectSuccess,
  updateProjectFailure,
  deleteProjectStart,
  deleteProjectSuccess,
  deleteProjectFailure,
} from '../slices/projectsSlice';

function* fetchProjectsSaga(action: PayloadAction<any>): Generator {
  try {
    const response = yield call(projectsApi.getProjects, action.payload);
    yield put(fetchProjectsSuccess(response.data));
  } catch (error: any) {
    yield put(fetchProjectsFailure(error.response?.data?.message || 'Failed to fetch projects'));
  }
}

function* fetchProjectSaga(action: PayloadAction<string>): Generator {
  try {
    const response = yield call(projectsApi.getProject, action.payload);
    yield put(fetchProjectSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchProjectFailure(error.response?.data?.message || 'Failed to fetch project'));
  }
}

function* createProjectSaga(action: PayloadAction<any>): Generator {
  try {
    const response = yield call(projectsApi.createProject, action.payload);
    yield put(createProjectSuccess(response.data.data));
  } catch (error: any) {
    yield put(createProjectFailure(error.response?.data?.message || 'Failed to create project'));
  }
}

function* updateProjectSaga(action: PayloadAction<{ id: string; data: any }>): Generator {
  try {
    const response = yield call(projectsApi.updateProject, action.payload.id, action.payload.data);
    yield put(updateProjectSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateProjectFailure(error.response?.data?.message || 'Failed to update project'));
  }
}

function* deleteProjectSaga(action: PayloadAction<string>): Generator {
  try {
    yield call(projectsApi.deleteProject, action.payload);
    yield put(deleteProjectSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteProjectFailure(error.response?.data?.message || 'Failed to delete project'));
  }
}

export default function* projectsSaga() {
  yield takeEvery(fetchProjectsStart.type, fetchProjectsSaga);
  yield takeEvery(fetchProjectStart.type, fetchProjectSaga);
  yield takeEvery(createProjectStart.type, createProjectSaga);
  yield takeEvery(updateProjectStart.type, updateProjectSaga);
  yield takeEvery(deleteProjectStart.type, deleteProjectSaga);
}