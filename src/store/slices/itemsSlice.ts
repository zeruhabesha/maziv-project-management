import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Item {
  id: string;
  project_id: string;
  phase_id?: string;
  type: string;
  name: string;
  brand?: string;
  model?: string;
  specifications?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  supplier_id?: string;
  status: string;
  deadline?: string;
  assigned_to?: string;
  supplier_name?: string;
  assigned_user_name?: string;
  phase_name?: string;
  description?: string;
  file?: string;
}

interface ItemsState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

const initialState: ItemsState = {
  items: [],
  loading: false,
  error: null,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    fetchItemsStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    fetchItemsSuccess: (state, action: PayloadAction<Item[]>) => {
      state.loading = false;
      state.items = action.payload;
    },
    fetchItemsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createItemStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    createItemSuccess: (state, action: PayloadAction<Item>) => {
      state.loading = false;
      state.items.unshift(action.payload);
    },
    createItemFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateItemStart: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.loading = true;
      state.error = null;
    },
    updateItemSuccess: (state, action: PayloadAction<Item>) => {
      state.loading = false;
      const index = state.items.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateItemFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteItemStart: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteItemSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    deleteItemFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
  clearError,
} = itemsSlice.actions;

export default itemsSlice.reducer;