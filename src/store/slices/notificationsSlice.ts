// src/store/slices/notificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  createdAt?: string;
}

interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],            // ✅ always an array
  unreadCount: 0,      // ✅ derived & stored for Header badge
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotificationsStart(state, _action: PayloadAction<{ userId: string }>) {
      state.loading = true;
      state.error = null;
    },
    fetchNotificationsSuccess(state, action: PayloadAction<Notification[]>) {
      state.loading = false;
      state.list = action.payload ?? [];
      state.unreadCount = state.list.filter(n => !n.is_read).length;
    },
    fetchNotificationsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    markNotificationReadStart(state, _action: PayloadAction<{ id: string }>) {
      // no-op
    },
    markNotificationReadSuccess(state, action: PayloadAction<{ id: string }>) {
      const n = state.list.find(x => x.id === action.payload.id);
      if (n) n.is_read = true;
      state.unreadCount = state.list.filter(x => !x.is_read).length;
    },
    markNotificationReadFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    clearNotifications(state) {
      state.list = [];
      state.unreadCount = 0;
    }
  },
});

export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markNotificationReadStart,
  markNotificationReadSuccess,
  markNotificationReadFailure,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
