import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: string;
  name: string;
  ref_no: string;
  start_date: string;
  end_date: string;
  client: string;
  manager_ids: string[];
  description: string;
  status: string;
  tender_value: number;
  file?: string;
  stats?: {
    total_items: number;
    completed_items: number;
    in_progress_items: number;
    pending_items: number;
    overdue_items: number;
    total_cost: number;
    progress_percentage: number;
  };
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    fetchProjectsStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    fetchProjectsSuccess: (state, action: PayloadAction<{ data: Project[]; pagination: any }>) => {
      state.loading = false;
      state.projects = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProjectStart: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.loading = false;
      state.currentProject = action.payload;
    },
    fetchProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createProjectStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    createProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.loading = false;
      state.projects.unshift(action.payload);
    },
    createProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProjectStart: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.loading = true;
      state.error = null;
    },
    updateProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.loading = false;
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    updateProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteProjectStart: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteProjectSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.projects = state.projects.filter(p => p.id !== action.payload);
    },
    deleteProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  clearError,
} = projectsSlice.actions;

export default projectsSlice.reducer;