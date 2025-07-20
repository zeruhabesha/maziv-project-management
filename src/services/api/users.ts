import api from '../api';

export const getUsers = () => api.get('/users');
export const createUser = (userData: any) => api.post('/users', userData);
export const updateUser = (id: string, userData: any) => api.put(`/users/${id}`, userData);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

export const getUserAlerts = (userId: string, projectId: string) =>
  api.get(`/users/${userId}/alerts?project_id=${projectId}`);
export const changeUserPassword = (userId: string, data: { currentPassword: string; newPassword: string }) =>
  api.put(`/users/${userId}/password`, data);