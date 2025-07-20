import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Lock, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createUserStart } from '../../store/slices/usersSlice';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, users, error } = useAppSelector(state => state.users);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormData>();

  const password = watch('password');

  useEffect(() => {
    if (isSubmitting && !loading && !error) {
      reset();
      setIsSubmitting(false);
      onClose();
    }
  }, [isSubmitting, loading, error, reset, onClose]);

  const onSubmit = (data: UserFormData) => {
    const { confirmPassword, ...userData } = data;
    setIsSubmitting(true);
    dispatch(createUserStart(userData));
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Add New User</h3>
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
                <option value="">Select a role</option>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
            <div>
              <label>Password</label>
              <input type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Must be at least 8 characters' }})} className="w-full p-2 border rounded" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" {...register('confirmPassword', { validate: value => value === password || 'Passwords do not match' })} className="w-full p-2 border rounded" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateUserModal;