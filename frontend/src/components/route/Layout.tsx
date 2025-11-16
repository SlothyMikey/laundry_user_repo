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
      <Sidebar isHidden={isHidden} />

      <main
        className={`flex-1 flex flex-col overflow-auto transform transition-transform duration-300 ${isHidden ? 'translate-x-0' : 'translate-x-64'}`}
      >
        {/* Header */}
        <Header
          title={meta.title}
          subtitle={meta.subtitle || 'No subtitle'}
          toggleSidebar={() => setIsHidden(!isHidden)}
        />

        {/* Main content goes here */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {/* This is where child routes render */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
