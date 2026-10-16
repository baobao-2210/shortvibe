import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const checkUnread = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.unreadCount || 0);
      } catch (err) {
        // silent fail
      }
    };

    checkUnread();
    const timer = setInterval(checkUnread, 20000);
    return () => clearInterval(timer);
  }, [isAuthenticated, location.pathname]);

  // If on fullscreen player or detailed modal, we can still show or hide as needed
  const isVideoFeed = location.pathname === '/';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 safe-pb border-t transition-colors ${
        isVideoFeed
          ? 'bg-black/85 backdrop-blur-xl border-white/10 text-white'
          : 'bg-surface/90 backdrop-blur-xl border-surface-container-highest/60 text-on-surface'
      }`}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {/* 1. Trang chủ (Feed) */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-white font-bold' : 'text-on-surface-variant hover:text-white'
            }`
          }
        >
          <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 tracking-tight">Trang chủ</span>
        </NavLink>

        {/* 2. Khám phá (Explore) */}
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
            }`
          }
        >
          <Compass size={22} strokeWidth={location.pathname === '/explore' ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 tracking-tight">Khám phá</span>
        </NavLink>

        {/* 3. Đăng video (+) - TikTok-style center button */}
        <NavLink
          to="/upload"
          className="flex items-center justify-center flex-1 py-1 active:scale-90 transition-transform"
          aria-label="Đăng video"
        >
          <div className="relative w-11 h-7 flex items-center justify-center">
            {/* Left cyan accent layer */}
            <div className="absolute inset-0 -left-1 bg-secondary rounded-lg opacity-80" />
            {/* Right pink/red accent layer */}
            <div className="absolute inset-0 -right-1 bg-primary rounded-lg opacity-80" />
            {/* White/Dark center button */}
            <div className="relative w-9 h-7 bg-white text-black rounded-lg flex items-center justify-center shadow-md">
              <Plus size={20} strokeWidth={3} />
            </div>
          </div>
        </NavLink>

        {/* 4. Hộp thư (Inbox) */}
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
            }`
          }
        >
          <div className="relative">
            <MessageSquare size={22} strokeWidth={location.pathname === '/inbox' ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Hộp thư</span>
        </NavLink>

        {/* 5. Hồ sơ (Profile) */}
        <NavLink
          to={user ? `/profile/${user.id}` : '/profile/me'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
            }`
          }
        >
          <User size={22} strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 tracking-tight">Hồ sơ</span>
        </NavLink>
      </div>
    </nav>
  );
};
