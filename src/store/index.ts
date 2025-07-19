import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { rootSaga } from './sagas';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import itemsReducer from './slices/itemsSlice';
import usersReducer from './slices/usersSlice';
import alertsReducer from './slices/alertsSlice';
import reportsReducer from './slices/reportsSlice'; // Import the new slice
import notificationsReducer from './slices/notificationsSlice';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    items: itemsReducer,
    users: usersReducer,
    alerts: alertsReducer,
    reports: reportsReducer, // Add the new slice reducer here
    notifications: notificationsReducer, // <-- Add this line
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // It's common to disable this check with Redux Saga
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;