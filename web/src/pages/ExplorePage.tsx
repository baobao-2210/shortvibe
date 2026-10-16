import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  History,
  X,
  Clock,
  Flame,
  ThumbsUp,
  User,
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { videosApi, usersApi, VideoItem, UserProfile, resolveMediaUrl } from '../services/api';

const RECENT_SEARCHES_KEY = 'shortvibe_search_history';

type SearchTab = 'all' | 'videos' | 'users';
type SortOption = 'newest' | 'views' | 'likes' | 'oldest';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search state
  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  // Data state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoMeta, setVideoMeta] = useState<{ total: number; totalPages: number } | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userMeta, setUserMeta] = useState<{ total: number; totalPages: number } | null>(null);
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with URL query param
  useEffect(() => {
    setSearchTerm(queryParam);
    setPage(1);
  }, [queryParam]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // Fetch trending hashtags on mount
  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const tags = await videosApi.getTrendingHashtags();
        setTrendingHashtags(tags);
      } catch (err) {
        console.error('Failed to fetch trending hashtags:', err);
      }
    };
    fetchHashtags();
  }, []);

  // Save to recent searches
  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota errors
      }
      return updated;
    });
  }, []);

  // Remove a single recent search
  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all recent searches
  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Main search & data fetching
  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const term = queryParam.trim();

        // 1. Fetch videos if activeTab is 'all' or 'videos'
        if (activeTab === 'all' || activeTab === 'videos') {
          const videoLimit = activeTab === 'all' ? 8 : 12;
          const videoRes = await videosApi.getFeed(page, videoLimit, term || undefined, sortBy);
          if (!isCancelled) {
            setVideos(videoRes.data || []);
            setVideoMeta({
              total: videoRes.meta?.total ?? videoRes.total ?? 0,
              totalPages: videoRes.meta?.totalPages ?? videoRes.totalPages ?? 1,
            });
          }
        } else {
          if (!isCancelled) setVideos([]);
        }

        // 2. Fetch users if activeTab is 'all' or 'users'
        if (activeTab === 'all' || activeTab === 'users') {
          const userLimit = activeTab === 'all' ? 4 : 10;
          const userRes = await usersApi.search(term || undefined, page, userLimit);
          if (!isCancelled) {
            setUsers(userRes.data || []);
            setUserMeta({
              total: userRes.meta?.total ?? 0,
              totalPages: userRes.meta?.totalPages ?? 1,
            });
          }
        } else {
          if (!isCancelled) setUsers([]);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [queryParam, activeTab, sortBy, page]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  // Click on a hashtag or search chip
  const handleTagClick = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    setSearchTerm(clean);
    saveRecentSearch(clean);
    setSearchParams({ q: clean });
  };

  const handleRecentClick = (term: string) => {
    setSearchTerm(term);
    saveRecentSearch(term);
    setSearchParams({ q: term });
  };

  const totalResults = (videoMeta?.total || 0) + (userMeta?.total || 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Search Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-surface-container-high/80 via-surface-container/60 to-surface-container-high/80 border border-surface-container-highest/60 p-6 md:p-8 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={14} />
            <span>Khám phá xu hướng & tìm kiếm</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight">
            Tìm kiếm video, hashtag & nhà sáng tạo
          </h1>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center mt-4 shadow-xl">
            <Search className="absolute left-4 md:left-5 text-on-surface-variant pointer-events-none" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên tài khoản, hashtag (#coffee) hoặc từ khóa video..."
              className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-28 md:pr-32 bg-surface-container-lowest/90 rounded-2xl text-base text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/60 border border-surface-container-highest/60 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchParams({});
                }}
                className="absolute right-20 md:right-24 text-on-surface-variant hover:text-white p-1 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 md:px-5 rounded-xl bg-gradient-to-r from-primary-container to-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Tìm</span>
            </button>
          </form>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-on-surface-variant flex items-center gap-1">
                <History size={13} />
                <span>Gần đây:</span>
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface border border-surface-container-highest/50 transition-colors"
                >
                  <span>{term}</span>
                  <span
                    onClick={(e) => removeRecentSearch(term, e)}
                    className="text-on-surface-variant hover:text-primary transition-colors ml-0.5"
                    title="Xóa"
                  >
                    <X size={12} />
                  </span>
                </button>
              ))}
              <button
                onClick={clearAllRecent}
                className="text-on-surface-variant/70 hover:text-primary transition-colors text-[11px] underline ml-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trending Hashtag Pills */}
      {trendingHashtags.length > 0 && (
        <div className="bg-surface-container-lowest/60 border border-surface-container-highest/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <Flame size={18} className="text-primary" />
            <span>Chủ đề nổi bật & Hashtags thịnh hành</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {trendingHashtags.map(({ tag, count }) => {
              const isSelected = queryParam.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(254,44,85,0.4)] scale-105'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-highest/60 hover:border-secondary-container/50'
                  }`}
                >
                  <span>{tag}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter, Sort & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-container-highest/40 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-surface-container-highest/40">
          <button
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Sparkles size={16} />
            <span>Tất cả</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('videos');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'videos'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Film size={16} />
            <span>Video {videoMeta?.total ? `(${videoMeta.total})` : ''}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <User size={16} />
            <span>Tài khoản {userMeta?.total ? `(${userMeta.total})` : ''}</span>
          </button>
        </div>

        {/* Sort Controls (for videos) */}
        {activeTab !== 'users' && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-on-surface-variant" />
            <span className="text-xs text-on-surface-variant font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
              className="bg-surface-container border border-surface-container-highest/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
            >
              <option value="newest">Mới nhất</option>
              <option value="views">Nhiều lượt xem nhất</option>
              <option value="likes">Nhiều lượt thích nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Results Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant font-medium">Đang tìm kiếm kết quả...</span>
        </div>
      ) : queryParam && totalResults === 0 && videos.length === 0 && users.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40 border border-surface-container-highest/60">
            <Search size={36} />
          </div>
          <h2 className="text-xl font-bold text-on-surface">Không tìm thấy kết quả nào</h2>
          <p className="text-sm text-on-surface-variant">
            Không có video hoặc người dùng nào khớp với từ khóa{' '}
            <span className="text-primary font-semibold">"{queryParam}"</span>. Hãy thử kiểm tra lỗi chính tả hoặc tìm
            kiếm với từ khóa khác.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {['#coffee', '#vietnam', '#dance', '#techreview'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full bg-surface-container text-xs text-secondary-container hover:bg-surface-container-high transition-colors"
              >
                Thử {tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* USER RESULTS SECTION (when activeTab is 'all' or 'users') */}
          {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  <span>Tài khoản ({userMeta?.total ?? users.length})</span>
                </h2>
                {activeTab === 'all' && (userMeta?.total || 0) > users.length && (
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setPage(1);
                    }}
                    className="text-xs text-primary hover:text-primary-container font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Xem tất cả tài khoản</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/40 hover:border-surface-container-highest hover:bg-surface-container/40 transition-all shadow-sm group"
                  >
                    <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-surface-container-highest/60 shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg text-primary bg-primary/10">
                            {(u.displayName || u.username)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {u.displayName || u.username}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate">@{u.username}</div>
                        <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
                          {u._count?.followers ?? u.followerCount ?? 0} người theo dõi •{' '}
                          {u._count?.videos ?? 0} video
                        </div>
                      </div>
                    </Link>

                    <Link
                      to={`/profile/${u.id}`}
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-white text-xs font-semibold text-on-surface transition-all shrink-0 ml-2 border border-surface-container-highest/40"
                    >
                      Xem hồ sơ
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIDEO RESULTS SECTION (when activeTab is 'all' or 'videos') */}
          {(activeTab === 'all' || activeTab === 'videos') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Film size={20} className="text-secondary-container" />
                  <span>
                    {queryParam ? `Video phù hợp (${videoMeta?.total ?? videos.length})` : 'Video thịnh hành'}
                  </span>
                </h2>
                {activeTab === 'all' && (videoMeta?.total || 0) > videos.length && (
                  <button
                    onClick={() => {
                      setActiveTab('videos');
                      setPage(1);
                    }}
                    className="text-xs text-secondary-container hover:underline font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Xem thêm video</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {videos.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-lowest/50 rounded-2xl border border-surface-container-highest/30 text-on-surface-variant text-sm">
                  Không tìm thấy video nào với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {videos.map((video) => {
                    const author = video.user || video.author;
                    return (
                      <div
                        key={video.id}
                        onClick={() => navigate(`/video/${video.id}`)}
                        className="group relative flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container-highest/40 hover:border-primary/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
                      >
                        {/* 9:16 Video Thumbnail Container */}
                        <div className="relative aspect-[9/16] bg-black overflow-hidden">
                          {video.thumbnailUrl ? (
                            <img
                              src={resolveMediaUrl(video.thumbnailUrl)}
                              alt={video.caption || 'Video thumbnail'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <video
                              src={resolveMediaUrl(video.videoUrl)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              preload="metadata"
                              muted
                            />
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                            <Eye size={12} className="text-secondary-container" />
                            <span>{(video.viewCount ?? video.viewsCount ?? 0).toLocaleString()}</span>
                          </div>

                          {video.durationSeconds && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                              {Math.floor(video.durationSeconds / 60)}:
                              {String(Math.floor(video.durationSeconds % 60)).padStart(2, '0')}
                            </div>
                          )}

                          {/* Bottom Gradient Overlay with stats */}
                          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-1 font-medium">
                              <Heart size={13} className="text-primary fill-primary" />
                              <span>{video.likeCount ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Caption and Author info */}
                        <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5 bg-surface-container-lowest">
                          <p className="text-xs text-on-surface line-clamp-2 font-medium leading-snug">
                            {video.caption || 'Không có mô tả'}
                          </p>

                          {author && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${author.id}`);
                              }}
                              className="flex items-center gap-1.5 pt-1 hover:opacity-80 transition-opacity"
                            >
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-container shrink-0">
                                {author.avatarUrl ? (
                                  <img src={author.avatarUrl} alt={author.username} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                                    {author.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-semibold truncate">
                                @{author.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {activeTab === 'videos' && videoMeta && videoMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>Trang trước</span>
                  </button>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Trang {page} / {videoMeta.totalPages}
                  </span>
                  <button
                    disabled={page >= videoMeta.totalPages}
                    onClick={() => setPage((p) => Math.min(videoMeta.totalPages, p + 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
                  >
                    <span>Trang sau</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* USER TAB PAGINATION */}
          {activeTab === 'users' && userMeta && userMeta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Trang trước</span>
              </button>
              <span className="text-xs text-on-surface-variant font-medium">
                Trang {page} / {userMeta.totalPages}
              </span>
              <button
                disabled={page >= userMeta.totalPages}
                onClick={() => setPage((p) => Math.min(userMeta.totalPages, p + 1))}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <span>Trang sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
