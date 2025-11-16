import { useState } from 'react';
import Sidebar from '../ui/sidebar';
import Header from '../ui/header';
import { Outlet, useLocation } from 'react-router-dom';
import { routeMeta } from '@/config/routeMeta';

export default function Layout() {
  const [isHidden, setIsHidden] = useState(false);
  const location = useLocation();
  const meta = routeMeta[location.pathname] || { title: '', subtitle: '' };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isHidden={isHidden} onClose={() => setIsHidden(true)} />

      {/* Main content wrapper - margin adjusts based on sidebar visibility */}
      <main
        className={`flex-1 flex flex-col overflow-auto transition-all duration-300 ${
          isHidden ? 'lg:ml-0' : 'lg:ml-64'
        }`}
      >
        {/* Header */}
        <Header
          title={meta.title}
          subtitle={meta.subtitle || 'No subtitle'}
          toggleSidebar={() => setIsHidden(!isHidden)}
        />

        {/* Main content */}
        <div className="flex-1 custom-scrollbar overflow-auto p-4 bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
