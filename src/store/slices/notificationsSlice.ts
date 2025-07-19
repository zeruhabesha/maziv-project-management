import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotificationsStart: (state, action: PayloadAction<string>) => { state.loading = true; state.error = null; },
    fetchNotificationsSuccess: (state, action: PayloadAction<Notification[]>) => {
      state.loading = false;
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.is_read).length;
    },
    fetchNotificationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => { n.is_read = true; });
      state.unreadCount = 0;
    },
  },
});

export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markNotificationRead,
  markAllNotificationsRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
