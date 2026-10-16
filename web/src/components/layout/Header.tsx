import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Send, Bell, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { notificationsApi } from '../../services/api';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

export const Header: React.FC = () => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadNotifCount(res.unreadCount || 0);
      } catch (err) {
        // ignore error
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/upload');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/85 backdrop-blur-xl border-b border-surface-container-highest/40 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      <div className="w-full h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary via-primary-container to-secondary-container flex items-center justify-center shadow-[0_0_15px_rgba(254,44,85,0.4)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[22px]">play_arrow</span>
          </div>
          <span className="font-headline-md text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-primary-container to-secondary-container bg-clip-text text-transparent select-none">
            ShortVibe
          </span>
        </Link>

        {/* SEARCH BAR (Center) */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="absolute left-4 text-on-surface-variant pointer-events-none" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tài khoản, nhạc và video thịnh hành..."
              className="w-full h-10 pl-11 pr-12 bg-surface-container-high/90 rounded-full text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-secondary-container transition-all border border-transparent focus:border-secondary-container/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </form>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary-container to-primary text-white font-semibold text-sm shadow-[0_0_16px_rgba(255,81,104,0.35)] hover:shadow-[0_0_24px_rgba(255,81,104,0.6)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Tải lên</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Direct Messages */}
              <button
                aria-label="Tin nhắn"
                className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors hidden sm:flex"
              >
                <Send size={20} />
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary-container text-white text-[10px] font-bold leading-none">
                  3
                </span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Thông báo"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className={`relative p-2 rounded-full transition-colors ${
                    isNotifOpen
                      ? 'bg-surface-container-high text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <Bell size={20} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none shadow-[0_0_8px_rgba(255,81,104,0.6)]">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                  onUnreadCountChange={setUnreadNotifCount}
                />
              </div>

              {/* User Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center shrink-0 rounded-full ring-2 ring-primary/40 hover:ring-secondary-container transition-all overflow-hidden"
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-surface-container-low border border-surface-container-highest/60 rounded-2xl p-2 shadow-2xl z-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-surface-container-highest/40 mb-1">
                      <p className="font-semibold text-sm text-white truncate">{user?.displayName || user?.fullName || user?.username}</p>
                      <p className="text-xs text-on-surface-variant truncate">@{user?.username}</p>
                    </div>

                    <Link
                      to={`/profile/${user?.id}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors"
                    >
                      <UserIcon size={16} />
                      <span>Xem hồ sơ</span>
                    </Link>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-error hover:bg-error-container/20 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Login Button */
            <button
              onClick={() => openAuthModal('login')}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-white font-semibold text-sm border border-surface-container-highest/60 transition-all hover:scale-[1.02]"
            >
              <LogIn size={16} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
