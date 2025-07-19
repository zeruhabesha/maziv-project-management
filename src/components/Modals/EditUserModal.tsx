import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateUserStart } from '../../store/slices/usersSlice';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.users);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>();

  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);

  useEffect(() => {
    if (!loading && isSubmitting) {
      setIsSubmitting(false);
      onClose();
    }
  }, [loading, isSubmitting, onClose]);

  const onSubmit = (data: UserFormData) => {
    setIsSubmitting(true);
    dispatch(updateUserStart({ id: user.id, data }));
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Edit User</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label>Full Name</label>
              <input {...register('name', { required: 'Name is required' })} className="w-full p-2 border rounded" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }})} className="w-full p-2 border rounded" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label>Role</label>
              <select {...register('role', { required: 'Role is required' })} className="w-full p-2 border rounded bg-white">
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditUserModal;