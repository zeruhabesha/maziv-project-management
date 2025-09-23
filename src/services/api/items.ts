import { api } from '../../lib/api';

export const getItems = (params: any) => api.get('/items', { params });
export const createItem = (itemData: any) => api.post('/items', itemData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateItem = (id: string, itemData: any) => api.put(`/items/${id}`, itemData);
export const deleteItem = (id: string) => api.delete(`/items/${id}`);