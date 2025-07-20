// Project interface (matches ProjectsState in projectsSlice)
export interface Project {
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

// User interface (matches UsersState in usersSlice)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

// Item interface (matches ItemsState in itemsSlice)
export interface Item {
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