import { call, put, takeEvery } from 'redux-saga/effects';
import { SagaReturnType } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as itemsApi from '../../services/api/items';
import {
  fetchItemsStart,
  fetchItemsSuccess,
  fetchItemsFailure,
  createItemStart,
  createItemSuccess,
  createItemFailure,
  updateItemStart,
  updateItemSuccess,
  updateItemFailure,
  deleteItemStart,
  deleteItemSuccess,
  deleteItemFailure,
} from '../slices/itemsSlice';

function* fetchItemsSaga(action: PayloadAction<any>): Generator {
  try {
    const response = yield call(itemsApi.getItems, action.payload);
    yield put(fetchItemsSuccess(response.data.data));
  } catch (error: any) {
    yield put(fetchItemsFailure(error.response?.data?.message || 'Failed to fetch items'));
  }
}

function* createItemSaga(action: PayloadAction<any>): Generator {
  try {
    const data = action.payload instanceof FormData ? action.payload : action.payload.formData || action.payload;
    const response = yield call(itemsApi.createItem, data);
    yield put(createItemSuccess(response.data.data));
  } catch (error: any) {
    yield put(createItemFailure(error.response?.data?.message || 'Failed to create item'));
  }
}

function* updateItemSaga(action: PayloadAction<{ id: string; data: any }>): Generator {
  try {
    const response = yield call(itemsApi.updateItem, action.payload.id, action.payload.data);
    yield put(updateItemSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateItemFailure(error.response?.data?.message || 'Failed to update item'));
  }
}

function* deleteItemSaga(action: PayloadAction<string>): Generator {
  try {
    yield call(itemsApi.deleteItem, action.payload);
    yield put(deleteItemSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteItemFailure(error.response?.data?.message || 'Failed to delete item'));
  }
}

export default function* itemsSaga() {
  yield takeEvery(fetchItemsStart.type, fetchItemsSaga);
  yield takeEvery(createItemStart.type, createItemSaga);
  yield takeEvery(updateItemStart.type, updateItemSaga);
  yield takeEvery(deleteItemStart.type, deleteItemSaga);
}