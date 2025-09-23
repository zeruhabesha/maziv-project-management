import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, FolderOpen, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { useAppDispatch } from '../../hooks/redux';
import { createProjectStart } from '../../store/slices/projectsSlice';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectFormData {
  name: string;
  ref_no: string;
  client: string;
  description: string;
  start_date: string;
  end_date: string;
  tender_value: number;
  manager_ids: string[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProjectFormData>();

  const startDate = watch('start_date');
  const [file, setFile] = React.useState<File | null>(null);

  const onSubmit = async (data: ProjectFormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('ref_no', data.ref_no);
    formData.append('client', data.client);
    formData.append('description', data.description);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('tender_value', String(data.tender_value));
    formData.append('manager_ids', JSON.stringify(data.manager_ids || []));
    formData.append('status', 'planning');
    if (file) formData.append('file', file);

    try {
      const response = await api.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Project created successfully');
      reset();
      setFile(null);
      onClose();
      // Optionally, refresh project list
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Generate reference number based on current year and random number
  const generateRefNo = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PRJ-${year}-${randomNum}`;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('name', { required: 'Project name is required' })}
                    type="text"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <div className="flex">
                  <input
                    {...register('ref_no', { required: 'Reference number is required' })}
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PRJ-2024-001"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const refNo = generateRefNo();
                      const event = { target: { value: refNo, name: 'ref_no' } };
                      // A better way to set value with react-hook-form
                      reset({ ...watch(), ref_no: refNo });
                    }}
                    className="px-3 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Generate
                  </button>
                </div>
                {errors.ref_no && (
                  <p className="mt-1 text-sm text-red-600">{errors.ref_no.message}</p>
                )}
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('client', { required: 'Client is required' })}
                    type="text"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter client name"
                  />
                </div>
                {errors.client && (
                  <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('start_date', { required: 'Start date is required' })}
                    type="date"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('end_date', {
                      required: 'End date is required',
                      validate: (value) =>
                        !startDate || value >= startDate || 'End date must be after start date',
                    })}
                    type="date"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                )}
              </div>

              {/* Tender Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('tender_value', {
                      required: 'Tender value is required',
                      min: { value: 0, message: 'Value must be positive' },
                    })}
                    type="number"
                    step="0.01"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                {errors.tender_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.tender_value.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter project description..."
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach File (Image, PDF, Word)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
              >
                Create Project
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProjectModal;