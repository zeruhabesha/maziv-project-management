import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Building2, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginStart, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { testApiConnection, testLoginEndpoint } from '../utils/apiTest';

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

  // Test API connection on component mount
  useEffect(() => {
    const runApiTests = async () => {
      console.log('Running API connection tests...');
      const healthTest = await testApiConnection();
      const loginTest = await testLoginEndpoint();
      
      console.log('API Tests Results:', {
        health: healthTest,
        login: loginTest
      });
    };
    
    runApiTests();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    console.log('Login form submitted:', { 
      email: data.email,
      environment: import.meta.env.MODE,
      apiUrl: import.meta.env.VITE_API_URL,
      isProd: import.meta.env.PROD,
      location: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Dispatch the login action
      await dispatch(loginStart(data));
      
      // If we get here, the login was successful (the saga will handle the redirect)
      // The success toast is already shown in the saga
    } catch (error) {
      // Error is already handled by the saga and shown via toast
      console.error('Login error in component:', error);
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                {...register('email', { 
                  required: 'Email is required', 
                  pattern: { 
                    value: /^\S+@\S+$/i, 
                    message: 'Invalid email address' 
                  }
                })} 
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter your email" 
              />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center"><p className="text-xs text-gray-500">Secure project management system</p></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
