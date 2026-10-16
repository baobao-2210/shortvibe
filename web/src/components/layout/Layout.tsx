import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AuthModal } from '../auth/AuthModal';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[720px] h-72 bg-gradient-to-b from-primary-container/15 via-tertiary-container/5 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-28 right-1/4 w-[560px] h-72 bg-gradient-to-t from-secondary-container/10 via-primary/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Global Header */}
      <Header />

      <div className="flex flex-1 pt-16 relative z-10">
        {/* Left Fixed Sidebar */}
        <Sidebar />

        {/* Main Content Area (offset left on md+ screens) */}
        <main className="flex-1 md:pl-64 w-full min-h-[calc(100vh-4rem)] flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Auth Modal (Login / Register) */}
      <AuthModal />
    </div>
  );
};
