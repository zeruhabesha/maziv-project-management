import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Users, Settings, Building2 } from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';

const Sidebar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || (user?.role === 'admin')
  );

  return (
    <div className="w-64 bg-white shadow-xl h-full flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="flex items-center justify-between h-16 px-6 border-b">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
        </div>
      </div>

      <nav className="mt-6 px-4 space-y-2 flex-1">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end // Use `end` prop for the dashboard link to not stay active on other routes
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-white">
            <span className="text-blue-600 font-semibold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;