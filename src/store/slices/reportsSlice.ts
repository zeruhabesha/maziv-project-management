import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ReportsState {
  dashboard: any;
  projectProgress: any;
  projectCost: any;
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  dashboard: null,
  projectProgress: null,
  projectCost: null,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    fetchDashboardStart: (state) => {
      state.loading = true;
    },
    fetchDashboardSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.dashboard = action.payload;
    },
    fetchDashboardFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Add other report actions if needed
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} = reportsSlice.actions;

export default reportsSlice.reducer;