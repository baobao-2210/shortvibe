import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, Users, Compass, Radio, Tag, CheckCircle } from 'lucide-react';

const SUGGESTED_ACCOUNTS = [
  {
    id: 'creator1',
    name: 'minhthu.vibe',
    sub: '1.4M người theo dõi',
    initial: 'M',
    color: 'text-primary',
    verified: true,
  },
  {
    id: 'creator2',
    name: 'khoai.tech',
    sub: '890K người theo dõi',
    initial: 'K',
    color: 'text-secondary-container',
    verified: true,
  },
  {
    id: 'creator3',
    name: 'gaming_pro_vn',
    sub: '520K người theo dõi',
    initial: 'G',
    color: 'text-tertiary',
    verified: false,
  },
];

const TRENDING_TAGS = [
  'LearnOnTikTok',
  'MusicTrends',
  'TechReview',
  'GamingVibes',
  'CyberpunkSaigon',
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest/90 backdrop-blur-xl border-r border-surface-container-highest/40 z-40 overflow-y-auto hidden md:flex flex-col py-4 px-3 space-y-5 no-scrollbar">
      {/* Primary Navigation */}
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isActive && location.pathname === '/' && !location.search
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-white'
            }`
          }
        >
          <Home size={20} />
          <span>Dành cho bạn</span>
        </NavLink>

        <NavLink
          to="/?tab=following"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isActive && location.search.includes('tab=following')
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-white'
            }`
          }
        >
          <Users size={20} />
          <span>Đang theo dõi</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isActive
                ? 'bg-surface-container-high text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-white'
            }`
          }
        >
          <Compass size={20} />
          <span>Khám phá</span>
        </NavLink>

        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high/60 hover:text-white transition-all cursor-pointer">
          <div className="flex items-center gap-3 font-semibold text-sm">
            <Radio size={20} className="text-primary-container" />
            <span>LIVE</span>
          </div>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-container text-white text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            LIVE
          </span>
        </div>
      </nav>

      <div className="h-[1px] bg-surface-container-highest/60 mx-1"></div>

      {/* Suggested Accounts */}
      <div className="space-y-2 px-1">
        <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant/70 font-bold block">
          Tài khoản được đề xuất
        </span>

        <div className="flex flex-col gap-1 pt-1">
          {SUGGESTED_ACCOUNTS.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-surface-container-high/60 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full bg-surface-container-highest shrink-0 flex items-center justify-center font-bold text-sm ${acc.color}`}>
                  {acc.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                      {acc.name}
                    </span>
                    {acc.verified && (
                      <CheckCircle size={12} className="text-secondary-container fill-secondary-container/20 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {acc.sub}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="text-xs font-semibold text-primary hover:text-primary-container pt-1 transition-colors block">
          Xem thêm
        </button>
      </div>

      <div className="h-[1px] bg-surface-container-highest/60 mx-1"></div>

      {/* Trending Topics */}
      <div className="space-y-2 px-1">
        <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant/70 font-bold block">
          Khám phá chủ đề
        </span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {TRENDING_TAGS.map((tag) => (
            <Link
              key={tag}
              to={`/explore?q=${encodeURIComponent(tag)}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high hover:text-secondary-container text-xs text-on-surface-variant transition-all border border-surface-container-highest/40"
            >
              <Tag size={12} className="text-secondary-container" />
              <span>{tag}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="h-[1px] bg-surface-container-highest/60 mx-1"></div>

      {/* Footer Info */}
      <div className="px-1 pt-1 space-y-2 mt-auto">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant/60">
          <a href="#" className="hover:text-on-surface transition-colors">Về chúng tôi</a>
          <a href="#" className="hover:text-on-surface transition-colors">Trợ giúp</a>
          <a href="#" className="hover:text-on-surface transition-colors">Điều khoản & Chính sách</a>
        </div>
        <p className="text-[11px] text-on-surface-variant/40 pt-1">
          © 2025 ShortVibe • Stitch Studio UI
        </p>
      </div>
    </aside>
  );
};
