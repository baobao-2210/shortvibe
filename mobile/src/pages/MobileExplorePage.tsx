import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Flame,
  History,
  Film,
  User,
  Eye,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';
import {
  videosApi,
  usersApi,
  VideoItem,
  UserProfile,
  resolveMediaUrl,
} from '../services/api';

const RECENT_KEY = 'shortvibe_mobile_searches';

export const MobileExplorePage: React.FC = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'videos' | 'users'>('videos');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'likes'>('newest');

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  // Fetch trending hashtags
  useEffect(() => {
    videosApi
      .getTrendingHashtags()
      .then((tags) => setTrendingTags(tags || []))
      .catch((err) => console.error(err));
  }, []);

  // Save recent search
  const saveRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((i) => i.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((i) => i !== term);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  };

  // Main search & data fetch
  const handlePerformSearch = async (termToSearch: string) => {
    setIsLoading(true);
    try {
      if (activeTab === 'videos') {
        const res = await videosApi.getFeed(1, 20, termToSearch || undefined, sortBy);
        setVideos(res.data || []);
      } else {
        const res = await usersApi.search(termToSearch || undefined, 1, 20);
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handlePerformSearch(searchTerm);
  }, [activeTab, sortBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) saveRecent(trimmed);
    handlePerformSearch(trimmed);
  };

  const handleSelectTag = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    setSearchTerm(clean);
    saveRecent(clean);
    handlePerformSearch(clean);
  };

  return (
    <div className="flex flex-col h-full bg-background text-on-surface overflow-hidden">
      {/* Top Mobile Search Header */}
      <div className="p-3.5 safe-pt border-b border-surface-container-highest/60 bg-surface/90 backdrop-blur-md space-y-3">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm video, hashtag (#coffee) hoặc tài khoản..."
            className="w-full h-10 pl-10 pr-20 bg-surface-container-high rounded-full text-xs text-on-surface placeholder:text-on-surface-variant/70 border border-surface-container-highest focus:border-primary focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                handlePerformSearch('');
              }}
              className="absolute right-12 text-on-surface-variant hover:text-white p-1"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 h-7 px-3 rounded-full bg-primary text-white text-xs font-bold active:scale-95"
          >
            Tìm
          </button>
        </form>

        {/* Recent Search Chips */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            <History size={13} className="text-on-surface-variant shrink-0" />
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchTerm(term);
                  handlePerformSearch(term);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface shrink-0 border border-surface-container-highest/60"
              >
                <span>{term}</span>
                <span onClick={(e) => removeRecent(term, e)} className="hover:text-primary">
                  <X size={11} />
                </span>
              </button>
            ))}
            <button
              onClick={clearAllRecent}
              className="text-on-surface-variant/70 hover:text-primary shrink-0 text-[10px] ml-1 underline"
            >
              Xóa
            </button>
          </div>
        )}

        {/* Trending Hashtag Pills */}
        {trendingTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <Flame size={14} className="text-primary shrink-0" />
            {trendingTags.map(({ tag, count }) => {
              const isSelected = searchTerm.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleSelectTag(tag)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface border-surface-container-highest/60'
                  }`}
                >
                  <span>{tag}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab switcher & Sort bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'videos'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Film size={14} />
              <span>Video</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <User size={14} />
              <span>Tài khoản</span>
            </button>
          </div>

          {activeTab === 'videos' && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <SlidersHorizontal size={12} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-surface-container border border-surface-container-highest rounded-lg px-2 py-0.5 text-[11px] text-on-surface focus:outline-none"
              >
                <option value="newest">Mới nhất</option>
                <option value="views">Nhiều view</option>
                <option value="likes">Nhiều tim</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Results View */}
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar pb-28">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-on-surface-variant">Đang tìm kiếm...</span>
          </div>
        ) : activeTab === 'videos' ? (
          videos.length === 0 ? (
            <div className="py-20 text-center text-xs text-on-surface-variant space-y-2">
              <Search size={32} className="mx-auto opacity-40" />
              <p>Không tìm thấy video nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/video/${video.id}`)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-surface-container-highest/60 active:scale-98 transition-transform cursor-pointer group"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={resolveMediaUrl(video.thumbnailUrl)}
                      alt={video.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={resolveMediaUrl(video.videoUrl)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )}

                  {/* Top view count badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                    <Eye size={11} className="text-secondary" />
                    <span>{(video.viewCount || 0).toLocaleString()}</span>
                  </div>

                  {/* Bottom info gradient */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/50 to-transparent text-white space-y-1">
                    <p className="text-[11px] line-clamp-2 leading-tight font-medium">
                      {video.caption || 'Video ShortVibe'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/80">
                      <span className="truncate max-w-[80px]">@{video.user?.username || 'user'}</span>
                      <div className="flex items-center gap-0.5 font-bold text-primary">
                        <Heart size={11} className="fill-primary" />
                        <span>{video.likeCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Users list */
          users.length === 0 ? (
            <div className="py-20 text-center text-xs text-on-surface-variant space-y-2">
              <User size={32} className="mx-auto opacity-40" />
              <p>Không tìm thấy người dùng nào phù hợp.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigate(`/profile/${u.id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-container border border-surface-container-highest/50 active:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest shrink-0">
                      {u.avatarUrl ? (
                        <img src={resolveMediaUrl(u.avatarUrl)} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-sm text-primary">
                          {(u.displayName || u.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-on-surface truncate">
                        {u.displayName || u.username}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">@{u.username}</div>
                      <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                        {u._count?.followers ?? u.followerCount ?? 0} người theo dõi • {u._count?.videos ?? 0} video
                      </div>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shrink-0 ml-2 shadow-sm">
                    Xem hồ sơ
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
