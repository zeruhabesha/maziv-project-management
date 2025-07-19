import React, { useEffect, useRef, useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchNotificationsStart } from '../../store/slices/notificationsSlice';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotificationsStart(user.id));
    }
  }, [user, dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('You have been logged out.');
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Placeholder for future global search */}
        <div />

        <div className="flex items-center space-x-4">
          <button
            ref={bellRef}
            className="relative p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-500">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b ${!n.is_read ? 'bg-blue-50' : ''}`}>
                      <div className="font-medium">{n.message}</div>
                      <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-white">
              <span className="text-blue-600 font-semibold">{userInitial}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;