import { api } from '../../lib/api';

export const getDashboardReport = () => api.get('/reports/dashboard');
export const getProjectProgressReport = (id: string) => api.get(`/reports/projects/${id}/progress`);
export const getProjectCostReport = (id: string) => api.get(`/reports/projects/${id}/cost`);