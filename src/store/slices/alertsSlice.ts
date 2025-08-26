// src/store/slices/alertsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Alert {
  id: string;
  user_id?: string;
  project_id?: string;
  type: 'overdue' | 'warning' | 'info' | string;
  severity?: 'low' | 'medium' | 'high';
  message: string;
  triggered_at?: string;
  Project?: { id: string; name: string };
}

interface AlertsState {
  list: Alert[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  list: [],         // ✅ always an array
  loading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    fetchAlertsStart(state, _action: PayloadAction<{ userId: string }>) {
      state.loading = true;
      state.error = null;
    },
    fetchAlertsSuccess(state, action: PayloadAction<Alert[]>) {
      state.loading = false;
      state.list = action.payload ?? [];
    },
    fetchAlertsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearAlerts(state) {
      state.list = [];
    }
  },
});

export const {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
  clearAlerts,
} = alertsSlice.actions;

export default alertsSlice.reducer;
