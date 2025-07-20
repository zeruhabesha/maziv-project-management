import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, FolderOpen, Calendar, DollarSign, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateProjectStart } from '../../store/slices/projectsSlice';
import { Project } from '../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

interface ProjectFormData {
  name: string;
  ref_no: string;
  client: string;
  description: string;
  start_date: string;
  end_date: string;
  tender_value: number;
  status: string;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.projects);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>();

  useEffect(() => {
    if (project) {
      // Format dates for the date input which expects 'YYYY-MM-DD'
      const startDate = new Date(project.start_date).toISOString().split('T')[0];
      const endDate = new Date(project.end_date).toISOString().split('T')[0];
      reset({ ...project, start_date: startDate, end_date: endDate });
    }
  }, [project, reset]);

  useEffect(() => {
    if (isSubmitting && !loading && !error) {
      setIsSubmitting(false);
      onClose();
    }
  }, [isSubmitting, loading, error, onClose]);

  const onSubmit = (data: ProjectFormData) => {
    const projectData = {
      ...data,
      tender_value: Number(data.tender_value),
    };
    setIsSubmitting(true);
    dispatch(updateProjectStart({ id: project.id, data: projectData }));
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Edit Project</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label>Project Name</label>
                <input {...register('name', { required: "Name is required" })} className="w-full p-2 border rounded" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label>Reference No.</label>
                <input {...register('ref_no', { required: "Ref No. is required" })} className="w-full p-2 border rounded" />
                {errors.ref_no && <p className="text-red-500 text-xs mt-1">{errors.ref_no.message}</p>}
              </div>
              <div>
                <label>Status</label>
                <select {...register('status')} className="w-full p-2 border rounded bg-white">
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label>Client</label>
                <input {...register('client', { required: "Client is required" })} className="w-full p-2 border rounded" />
                {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
              </div>
              <div>
                <label>Tender Value</label>
                <input type="number" step="0.01" {...register('tender_value', { valueAsNumber: true, min: 0 })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label>Start Date</label>
                <input type="date" {...register('start_date', { required: "Start date is required" })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" {...register('end_date', { required: "End date is required" })} className="w-full p-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label>Description</label>
                <textarea {...register('description')} className="w-full p-2 border rounded" rows={3}></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProjectModal;