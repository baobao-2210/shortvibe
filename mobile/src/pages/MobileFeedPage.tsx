import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Volume2,
  VolumeX,
  Music2,
  Search,
  Radio,
  Sparkles,
} from 'lucide-react';
import { videosApi, likesApi, followsApi, VideoItem, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MobileCommentsDrawer } from '../components/feed/MobileCommentsDrawer';

export const MobileFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [_page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');

  // Drawer & Interactions
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Fetch feed videos from Backend
  const fetchFeed = useCallback(
    async (pageNum = 1) => {
      try {
        const res = await videosApi.getFeed(pageNum, 10);
        const newItems = res.data || [];
        if (pageNum === 1) {
          setVideos(newItems);
        } else {
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.id));
            const unique = newItems.filter((v) => !existingIds.has(v.id));
            return [...prev, ...unique];
          });
        }
        setHasMore(newItems.length >= 10);
      } catch (err) {
        console.error('Failed to load feed videos:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  // Load more when reaching near the end
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const currentIndex = Math.round(scrollTop / clientHeight);

    if (currentIndex !== activeVideoIndex && currentIndex >= 0 && currentIndex < videos.length) {
      setActiveVideoIndex(currentIndex);
    }

    if (hasMore && !isLoading && scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
      setPage((p) => {
        const next = p + 1;
        fetchFeed(next);
        return next;
      });
    }
  };

  // Play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;
      if (index === activeVideoIndex) {
        videoEl.muted = isMuted;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('Autoplay deferred or muted required:', err);
          });
        }
        // Record view in backend
        if (videos[activeVideoIndex]?.id) {
          videosApi.recordView(videos[activeVideoIndex].id).catch(() => {});
        }
      } else {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    });
  }, [activeVideoIndex, isMuted, videos]);

  // Single / Double tap handler
  const handleVideoTouch = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap -> Trigger Like with heart burst animation
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setHeartBursts((prev) => [...prev, { id: now, x, y }]);
      setTimeout(() => {
        setHeartBursts((prev) => prev.filter((h) => h.id !== now));
      }, 800);

      const currentVideo = videos[index];
      if (currentVideo && !currentVideo.isLiked) {
        handleLikeToggle(index);
      }
    } else {
      // Single tap -> Play / Pause toggle
      const videoEl = videoRefs.current[index];
      if (videoEl) {
        if (videoEl.paused) {
          videoEl.play();
        } else {
          videoEl.pause();
        }
      }
    }
    lastTapRef.current = now;
  };

  // Like / Unlike Toggle
  const handleLikeToggle = async (index: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const currentVideo = videos[index];
    if (!currentVideo) return;

    const previousLiked = currentVideo.isLiked;
    const previousCount = currentVideo.likeCount;

    // Optimistic update
    setVideos((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              isLiked: !previousLiked,
              likeCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1,
            }
          : v
      )
    );

    try {
      if (previousLiked) {
        await likesApi.unlikeVideo(currentVideo.id);
      } else {
        await likesApi.likeVideo(currentVideo.id);
      }
    } catch (err) {
      // Revert on error
      setVideos((prev) =>
        prev.map((v, i) =>
          i === index ? { ...v, isLiked: previousLiked, likeCount: previousCount } : v
        )
      );
    }
  };

  // Follow / Unfollow Toggle
  const handleFollowToggle = async (index: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const currentVideo = videos[index];
    if (!currentVideo) return;

    const authorId = currentVideo.userId;
    if (authorId === user?.id) return; // Cannot follow yourself

    const previousFollowing = currentVideo.isFollowing;

    setVideos((prev) =>
      prev.map((v) => (v.userId === authorId ? { ...v, isFollowing: !previousFollowing } : v))
    );

    try {
      if (previousFollowing) {
        await followsApi.unfollow(authorId);
        showToast('Đã bỏ theo dõi');
      } else {
        await followsApi.follow(authorId);
        showToast('Đã theo dõi');
      }
    } catch {
      // Revert
      setVideos((prev) =>
        prev.map((v) => (v.userId === authorId ? { ...v, isFollowing: previousFollowing } : v))
      );
    }
  };

  // Share video
  const handleShare = (video: VideoItem) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: 'ShortVibe Video',
          text: video.caption || 'Xem video này trên ShortVibe!',
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface-container-high/90 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-surface-container-highest animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Top Mobile Bar Overlay (Live, Tabs, Search) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4 safe-pt text-white pointer-events-auto">
        {/* Left: LIVE */}
        <button
          onClick={() => showToast('Tính năng LIVE sắp ra mắt!')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold active:scale-95 transition-all text-primary"
        >
          <Radio size={14} className="animate-pulse" />
          <span>LIVE</span>
        </button>

        {/* Center: Tabs Switcher */}
        <div className="flex items-center gap-4 text-sm font-bold drop-shadow-md">
          <button
            onClick={() => {
              setActiveTab('following');
              showToast('Đang hiển thị video đang theo dõi');
            }}
            className={`transition-colors ${
              activeTab === 'following'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Đang follow
          </button>
          <button
            onClick={() => setActiveTab('foryou')}
            className={`transition-colors ${
              activeTab === 'foryou'
                ? 'text-white border-b-2 border-white pb-0.5'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Dành cho bạn
          </button>
        </div>

        {/* Right: Search button */}
        <button
          onClick={() => navigate('/explore')}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-all"
          aria-label="Tìm kiếm"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Feed Snap Container */}
      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/70 font-medium">Đang tải bảng tin ShortVibe...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 text-white">
          <Sparkles size={36} className="text-primary" />
          <h2 className="text-lg font-bold">Chưa có video nào</h2>
          <p className="text-xs text-white/60 max-w-xs">
            Hãy là người đầu tiên đăng tải video ngắn độc đáo của bạn lên ShortVibe!
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-lg shadow-primary/30 active:scale-95"
          >
            Đăng video ngay
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full feed-snap-container no-scrollbar"
        >
          {videos.map((video, index) => {
            const author = video.user;
            const isCurrent = index === activeVideoIndex;
            const isAuthorMe = author?.id === user?.id;

            return (
              <div
                key={video.id}
                className="relative w-full h-full feed-snap-item flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Clickable video viewport */}
                <div
                  onClick={(e) => handleVideoTouch(index, e)}
                  className="relative w-full h-full flex items-center justify-center cursor-pointer"
                >
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={resolveMediaUrl(video.videoUrl)}
                    poster={resolveMediaUrl(video.thumbnailUrl)}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    preload={isCurrent ? 'auto' : 'none'}
                  />

                  {/* Double tap heart burst animations */}
                  {heartBursts.map((h) => (
                    <div
                      key={h.id}
                      style={{ left: h.x - 40, top: h.y - 40 }}
                      className="absolute pointer-events-none animate-heart-burst"
                    >
                      <Heart size={80} className="text-primary fill-primary drop-shadow-[0_0_16px_rgba(254,44,85,0.8)]" />
                    </div>
                  ))}

                  {/* Sound mute/unmute overlay button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="absolute top-20 right-4 p-2 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all z-20"
                    aria-label="Bật/Tắt âm thanh"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>

                {/* Bottom gradient mask for crisp contrast */}
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

                {/* Right Action Sidebar (Avatar, Like, Comment, Share, Music Disc) */}
                <div
                  style={{ bottom: 'calc(var(--bottom-nav-height, 68px) + 20px)' }}
                  className="absolute right-2.5 z-20 flex flex-col items-center gap-3"
                >
                  {/* Author Avatar with Follow Plus */}
                  <div className="relative mb-0.5">
                    <div
                      onClick={() => author?.id && navigate(`/profile/${author.id}`)}
                      className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-primary to-secondary cursor-pointer"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-surface">
                        {author?.avatarUrl ? (
                          <img
                            src={resolveMediaUrl(author.avatarUrl)}
                            alt={author.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">
                            {(author?.displayName || author?.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {!video.isFollowing && !isAuthorMe && (
                      <button
                        onClick={() => handleFollowToggle(index)}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-md border border-black active:scale-90 transition-transform"
                      >
                        <Plus size={11} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleLikeToggle(index)}
                      className="p-1.5 active:scale-75 transition-transform"
                    >
                      <Heart
                        size={28}
                        className={
                          video.isLiked
                            ? 'text-primary fill-primary filter drop-shadow-[0_0_8px_rgba(254,44,85,0.7)]'
                            : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                        }
                      />
                    </button>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {video.likeCount}
                    </span>
                  </div>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setActiveCommentVideoId(video.id)}
                      className="p-1.5 active:scale-75 transition-transform"
                    >
                      <MessageCircle
                        size={26}
                        className="text-white fill-white/20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      />
                    </button>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {video.commentCount}
                    </span>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleShare(video)}
                      className="p-1.5 active:scale-75 transition-transform"
                    >
                      <Share2
                        size={25}
                        className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      />
                    </button>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">Chia sẻ</span>
                  </div>

                  {/* Spinning Vinyl Music Record */}
                  <div className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-spin-slow shadow-lg">
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-primary/30 flex items-center justify-center">
                      <Music2 size={10} className="text-secondary" />
                    </div>
                  </div>
                </div>

                {/* Bottom Left Info (Username, Caption, Hashtags, Audio) */}
                <div
                  style={{ bottom: 'calc(var(--bottom-nav-height, 68px) + 20px)' }}
                  className="absolute left-3.5 right-16 z-20 text-white space-y-1.5 pointer-events-none"
                >
                  {/* Author Name */}
                  <div
                    onClick={() => author?.id && navigate(`/profile/${author.id}`)}
                    className="inline-flex items-center gap-1.5 pointer-events-auto cursor-pointer"
                  >
                    <span className="text-xs font-bold drop-shadow-md hover:underline">
                      @{author?.username || 'user'}
                    </span>
                  </div>

                  {/* Caption & Hashtags */}
                  <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md font-medium">
                    {video.caption || 'Thưởng thức video ngắn trên ShortVibe! #shortvibe'}
                  </p>

                  {/* Music audio marquee line */}
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                    <Music2 size={12} className="shrink-0" />
                    <span className="truncate drop-shadow-md">
                      Âm thanh gốc - @{author?.username || 'shortvibe'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comments Drawer */}
      <MobileCommentsDrawer
        videoId={activeCommentVideoId}
        isOpen={!!activeCommentVideoId}
        onClose={() => setActiveCommentVideoId(null)}
        onCommentCountChange={(newCount) => {
          setVideos((prev) =>
            prev.map((v) => (v.id === activeCommentVideoId ? { ...v, commentCount: newCount } : v))
          );
        }}
      />
    </div>
  );
};
