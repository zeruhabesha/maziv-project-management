import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Package, DollarSign, Users, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createItemStart, updateItemStart } from '../../store/slices/itemsSlice';
import toast from 'react-hot-toast';
import { Item, User } from '../../types';

interface CreateEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Item; // The item to edit, if any
  projectId: string;
  users: User[]; // List of users for assignment
}

interface ItemFormData {
  name: string;
  type: string;
  status: string;
  quantity: number;
  unit_price: number;
  assigned_to?: number;
  deadline?: string;
  description?: string;
}

const CreateEditItemModal: React.FC<CreateEditItemModalProps> = ({ isOpen, onClose, item, projectId, users }) => {
  const dispatch = useAppDispatch();
  const { loading, error, items } = useAppSelector(state => state.items);
  const isEditing = !!item;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>();

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (item) {
      // If editing, populate form with item data
      const deadline = item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '';
      reset({ ...item, deadline });
    } else {
      // If creating, reset to default values
      reset({
        name: '', type: '', status: 'pending', quantity: 1, unit_price: 0,
        assigned_to: undefined, deadline: '', description: ''
      });
    }
  }, [item, reset, isOpen]);
  
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const onSubmit = (data: ItemFormData) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      project_id: projectId,
      quantity: Number(data.quantity),
      unit_price: Number(data.unit_price),
      assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
    };

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('type', data.type);
    formData.append('name', data.name);
    if (file) formData.append('file', file);
    formData.append('status', data.status);
    formData.append('quantity', data.quantity.toString());
    formData.append('unit_price', data.unit_price.toString());
    formData.append('assigned_to', data.assigned_to ? data.assigned_to.toString() : '');
    formData.append('deadline', data.deadline || '');
    formData.append('description', data.description || '');

    if (isEditing) {
      dispatch(updateItemStart({ id: item.id, data: payload }));
    } else {
      dispatch(createItemStart(formData));
    }
    // The saga will handle toasts and state updates
  };

  useEffect(() => {
    if (isSubmitting && !loading && !error) {
      setIsSubmitting(false);
      onClose();
    }
  }, [isSubmitting, loading, error, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{isEditing ? 'Edit Item' : 'Create New Item'}</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label>Name</label>
                <input {...register('name', { required: "Name is required" })} className="w-full p-2 border rounded" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label>Type</label>
                <input {...register('type', { required: "Type is required" })} className="w-full p-2 border rounded" />
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <label>Status</label>
                <select {...register('status')} className="w-full p-2 border rounded bg-white">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label>Quantity</label>
                <input type="number" {...register('quantity', { valueAsNumber: true, min: 0 })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label>Unit Price</label>
                <input type="number" step="0.01" {...register('unit_price', { valueAsNumber: true, min: 0 })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label>Assigned To</label>
                <select {...register('assigned_to', { valueAsNumber: true })} className="w-full p-2 border rounded bg-white">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label>Deadline</label>
                <input type="date" {...register('deadline')} className="w-full p-2 border rounded" />
              </div>
            </div>
            <div>
              <label>Description</label>
              <textarea {...register('description')} className="w-full p-2 border rounded" rows={3} />
            </div>
            <div>
              <label>Attachment</label>
              <input
                type="file"
                name="attachment"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEditItemModal;