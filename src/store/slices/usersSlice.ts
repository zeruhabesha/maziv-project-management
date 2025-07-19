import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<User[]>) => {
      state.loading = false;
      state.users = action.payload;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createUserStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    createUserSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.users.unshift(action.payload);
    },
    createUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserStart: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.loading = true;
      state.error = null;
    },
    updateUserSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUserStart: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    deleteUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;