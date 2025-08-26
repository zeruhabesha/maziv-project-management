// src/components/Layout/Header.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Bell, AlertTriangle, LogOut, UserCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchNotificationsStart, markNotificationReadStart } from '../../store/slices/notificationsSlice';
import { fetchAlertsStart } from '../../store/slices/alertsSlice';
import { logout } from '../../store/slices/authSlice';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const { list: notifications = [], unreadCount = 0 } = useAppSelector(s => s.notifications) ?? {};
  const { list: alerts = [] } = useAppSelector(s => s.alerts) ?? {};

  const [open, setOpen] = useState<{ type: 'none' | 'alerts' | 'notifications' }>({ type: 'none' });

  // Fetch on mount / when user becomes available
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotificationsStart({ userId: user.id }));
      dispatch(fetchAlertsStart({ userId: user.id }));
    }
  }, [dispatch, user?.id]);

  const initials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(' ');
    return (parts[0]?.[0] || 'U') + (parts[1]?.[0] || '');
  }, [user?.name]);

  const handleLogout = () => dispatch(logout());

  const toggle = (type: 'alerts' | 'notifications') =>
    setOpen(prev => ({ type: prev.type === type ? 'none' : type }));

  const onMarkRead = (id: string) => dispatch(markNotificationReadStart({ id }));

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="font-semibold text-gray-900 dark:text-gray-100">ProjectFlow</Link>

        <div className="flex items-center space-x-2">
          {/* Alerts */}
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => toggle('alerts')}
              aria-label="Alerts"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
            {open.type === 'alerts' && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-2 font-medium border-b dark:border-gray-700">Recent Alerts</div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length ? alerts.map(a => (
                    <div key={a.id} className="px-4 py-3 text-sm border-b last:border-0 dark:border-gray-700">
                      <div className="flex items-start space-x-2">
                        <span className={`mt-1 inline-block w-2 h-2 rounded-full ${a.severity === 'high' || a.type === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <div>
                          <div className="text-gray-900 dark:text-gray-100">{a.message}</div>
                          <div className="text-xs text-gray-500">
                            {a.Project?.name ? `Project: ${a.Project.name}` : '—'} • {a.triggered_at ? new Date(a.triggered_at).toLocaleString() : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : <div className="px-4 py-8 text-center text-sm text-gray-500">No alerts</div>}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => toggle('notifications')}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{unreadCount}</span>}
            </button>
            {open.type === 'notifications' && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-2 font-medium border-b dark:border-gray-700">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length ? notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 text-sm border-b last:border-0 dark:border-gray-700">
                      <div className="flex items-start justify-between space-x-2">
                        <div className="text-gray-900 dark:text-gray-100">{n.message}</div>
                        {!n.is_read && (
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => onMarkRead(n.id)}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                    </div>
                  )) : <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications</div>}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          </div>

          {/* Logout */}
          <button className="ml-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleLogout} aria-label="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
