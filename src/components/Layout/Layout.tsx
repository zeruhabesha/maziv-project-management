import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar: fixed on mobile, static on desktop */}
      <div className="z-40">
        <Sidebar />
      </div>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;