import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor, Bell, Shield, User, Mail, Lock, Save } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { updateUserStart } from '../store/slices/usersSlice';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') || 'system');
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
  }, [user]);

  useEffect(() => {
    if (darkMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [darkMode]);

  const handleDarkModeChange = (mode: string) => {
    setDarkMode(mode);
    localStorage.setItem('darkMode', mode);

    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    toast.success('Theme updated!');
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && (profileData.name !== user.name || profileData.email !== user.email)) {
      dispatch(updateUserStart({ id: user.id, data: { name: profileData.name, email: profileData.email } }));
      // Saga will handle the success/error toast
    } else {
      toast('No changes to save in profile.');
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    // In a real app, dispatch an action to a dedicated password change endpoint.
    // dispatch(changePasswordStart({ ...passwordData }));
    toast.success('Password update functionality is not yet connected to the backend.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="space-y-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => handleDarkModeChange(value)} className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${darkMode === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <Icon className="h-5 w-5" /><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-8">
          <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input value={profileData.name} onChange={e => setProfileData(p => ({...p, name: e.target.value}))} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input type="email" value={profileData.email} onChange={e => setProfileData(p => ({...p, email: e.target.value}))} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end mt-6"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"><Save size={16} /><span>Save Profile</span></button></div>
          </form>

          <form onSubmit={handlePasswordUpdate} className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input type="password" onChange={e => setPasswordData(p => ({...p, currentPassword: e.target.value}))} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" onChange={e => setPasswordData(p => ({...p, newPassword: e.target.value}))} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input type="password" onChange={e => setPasswordData(p => ({...p, confirmNewPassword: e.target.value}))} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end mt-6"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"><Save size={16} /><span>Update Password</span></button></div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;