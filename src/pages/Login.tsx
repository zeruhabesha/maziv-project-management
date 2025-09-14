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

  const [apiStatus, setApiStatus] = useState<{
    health: any;
    login: any;
    loading: boolean;
  }>({ health: null, login: null, loading: true });

  // Test API connection on component mount
  useEffect(() => {
    const runApiTests = async () => {
      console.log('Running API connection tests...');
      setApiStatus(prev => ({ ...prev, loading: true }));
      
      try {
        const [healthTest, loginTest] = await Promise.all([
          testApiConnection(),
          testLoginEndpoint()
        ]);
        
        console.log('API Tests Results:', { health: healthTest, login: loginTest });
        
        // Show toast if there are any issues
        if (!healthTest.success) {
          toast.error(`API Connection Error: ${healthTest.error || 'Unknown error'}`);
        } else if (!loginTest.success) {
          toast.error(`Login Test Failed: ${loginTest.error || 'Unknown error'}`);
        } else {
          toast.success('API connection test successful!');
        }
        
        setApiStatus({
          health: healthTest,
          login: loginTest,
          loading: false
        });
      } catch (error) {
        console.error('Error running API tests:', error);
        toast.error('Failed to run API tests');
        setApiStatus(prev => ({ ...prev, loading: false }));
      }
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
    return <Navigate to="/dashboard" />;
  }

  const renderApiStatus = () => {
    if (apiStatus.loading) {
      return (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          Testing API connection...
        </div>
      );
    }

    return (
      <div className="mb-4 space-y-2">
        <div className={`p-3 rounded-md text-sm ${
          apiStatus.health?.success 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          <div className="font-medium">API Status</div>
          <div className="text-xs mt-1">
            {apiStatus.health?.success 
              ? '✅ Connected to the API server'
              : `❌ Connection failed: ${apiStatus.health?.error || 'Unknown error'}`}
          </div>
          {apiStatus.health?.url && (
            <div className="text-xs opacity-75 mt-1">URL: {apiStatus.health.url}</div>
          )}
        </div>

        <div className={`p-3 rounded-md text-sm ${
          apiStatus.login?.success 
            ? 'bg-green-50 text-green-700' 
            : 'bg-amber-50 text-amber-700'
        }`}>
          <div className="font-medium">Login Test</div>
          <div className="text-xs mt-1">
            {apiStatus.login?.success 
              ? '✅ Login endpoint is working'
              : `⚠️ Login test failed: ${apiStatus.login?.error || 'Unknown error'}`}
          </div>
          {apiStatus.login?.url && (
            <div className="text-xs opacity-75 mt-1">URL: {apiStatus.login.url}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4"><Building2 className="h-12 w-12 text-blue-600" /></div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ProjectFlow</h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          {/* API Status */}
          {renderApiStatus()}

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
