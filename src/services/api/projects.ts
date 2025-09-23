import { api } from '../../lib/api';

// Get all projects with optional query parameters
export const getProjects = (params: any) => api.get('/projects', { params });

// Get a single project by its ID
export const getProject = (id: string) => api.get(`/projects/${id}`);

// Create a new project
export const createProject = (projectData: any) => api.post('/projects', projectData);

// Update an existing project
export const updateProject = (id: string, projectData: any) => api.put(`/projects/${id}`, projectData);

// Delete a project
export const deleteProject = (id: string) => api.delete(`/projects/${id}`);

// Upload a file to a project
export const uploadProjectFile = (id: string, formData: FormData) => 
  api.post(`/projects/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getCompletedProjectsForUser = (userId: string) =>
  api.get(`/projects/completed/for-user/${userId}`);