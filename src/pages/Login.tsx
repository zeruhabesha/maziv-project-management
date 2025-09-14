import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Building2, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginStart, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (data: LoginForm) => {
    console.log('Login form submitted:', { email: data.email });
    console.log('Current API base URL:', import.meta.env.VITE_API_URL || 'default');
    dispatch(loginStart(data));
  };
  
  // New handler for one-click demo login
  const handleDemoLogin = (role: 'admin' | 'manager' | 'user') => {
    let credentials = { email: '', password: 'password123' }; // Use a consistent secure password
    if(role === 'admin') credentials.email = 'admin@projectflow.com';
    if(role === 'manager') credentials.email = 'manager@projectflow.com';
    if(role === 'user') credentials.email = 'user@projectflow.com';
    
    dispatch(loginStart(credentials));
  };


  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4"><Building2 className="h-12 w-12 text-blue-600" /></div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ProjectFlow</h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-3">One-Click Demo Login:</p>
            <div className="space-y-2">
              <button type="button" onClick={() => handleDemoLogin('admin')} className="w-full flex items-center justify-between text-left p-2 text-sm bg-white rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                <div><strong className="text-blue-800">Admin:</strong> Full control</div>
                <PlayCircle className="h-5 w-5 text-blue-500" />
              </button>
              <button type="button" onClick={() => handleDemoLogin('manager')} className="w-full flex items-center justify-between text-left p-2 text-sm bg-white rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                <div><strong className="text-blue-800">Manager:</strong> Create/edit projects</div>
                 <PlayCircle className="h-5 w-5 text-blue-500" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }})} type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\" placeholder="Enter your email" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input {...register('password', { required: 'Password is required' })} type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50">
              {loading ? <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Signing in...</div> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center"><p className="text-xs text-gray-500">Secure project management system</p></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
