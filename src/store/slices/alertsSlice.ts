import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  item_id?: string;
  project_id: string;
  type: string;
  message: string;
  severity: string;
  is_read: boolean;
  triggered_at?: string;
  project_name?: string;
  item_name?: string;
  Project?: { name?: string };
  Item?: { name?: string };
}

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {     
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    fetchAlertsStart: (state, action: PayloadAction<{ userId: string; projectId?: string }>) => {
      console.log('fetchAlertsStart action dispatched');
      state.loading = true;
      state.error = null;
    },
    fetchAlertsSuccess: (state, action: PayloadAction<Alert[]>) => {
      state.loading = false;
      state.alerts = action.payload;
      state.unreadCount = action.payload.filter(a => !a.is_read).length;
    },
    fetchAlertsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.is_read) {
        alert.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.alerts.forEach(alert => {
        alert.is_read = true;
      });
      state.unreadCount = 0;
    },
  },
});

export const {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
  markAsRead,
  markAllAsRead,
} = alertsSlice.actions;

export default alertsSlice.reducer;