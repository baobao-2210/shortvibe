import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileAuthModal } from '../auth/MobileAuthModal';

export const MobileLayout: React.FC = () => {
  const location = useLocation();

  // If we are in full camera recording mode or full video player, hide bottom nav
  const hideBottomNav = location.pathname.startsWith('/video/');

  return (
    <div className="flex flex-col h-screen w-screen max-w-md mx-auto bg-background text-on-surface overflow-hidden relative shadow-2xl">
      {/* Screen Outlet */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Persistent Bottom Nav */}
      {!hideBottomNav && <MobileBottomNav />}

      {/* Global Auth Sheet */}
      <MobileAuthModal />
    </div>
  );
};
