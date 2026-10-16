import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoItem } from '../../types/video';
import { VideoCard } from './VideoCard';
import { CommentDrawer } from './CommentDrawer';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface VideoFeedProps {
  videos: VideoItem[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLikeToggle?: (videoId: string, isLiked: boolean) => void;
  onBookmarkToggle?: (videoId: string, isBookmarked: boolean) => void;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  onShare?: (video: VideoItem) => void;
  onRecordView?: (videoId: string) => void;
  onCommentAdded?: (videoId: string, newTotal: number) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  videos,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onLikeToggle,
  onBookmarkToggle,
  onFollowToggle,
  onShare,
  onRecordView,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Slide-over Comment Drawer state
  const [commentVideo, setCommentVideo] = useState<VideoItem | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isScrollingRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < videos.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [videos.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Trigger loadMore when user reaches near the end of videos list
  useEffect(() => {
    if (currentIndex >= videos.length - 2 && hasMore && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [currentIndex, videos.length, hasMore, isLoadingMore, onLoadMore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Mouse wheel scroll navigation (debounced)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If comment drawer is open, let user scroll inside comment list
      if (commentVideo) return;

      if (isScrollingRef.current) return;

      if (Math.abs(e.deltaY) > 25) {
        isScrollingRef.current = true;
        if (e.deltaY > 0) {
          goToNext();
        } else {
          goToPrev();
        }
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 400);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [commentVideo, goToNext, goToPrev]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (commentVideo) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (commentVideo || touchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartYRef.current = null;

    if (Math.abs(deltaY) > 40) {
      if (deltaY < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const handleShareClick = (video: VideoItem) => {
    if (onShare) {
      onShare(video);
    } else if (navigator.share) {
      navigator
        .share({
          title: video.caption,
          url: `${window.location.origin}/video/${video.id}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
      showToast('Đã sao chép liên kết video!');
    }
  };

  const currentVideo = videos[currentIndex] || videos[0];
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#e6bcbd] gap-2">
        <span className="material-symbols-outlined text-[48px] text-[#fe2c55]">videocam_off</span>
        <p className="font-['Space_Grotesk'] text-[16px]">Chưa có video nào trên bảng tin</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-[calc(100vh-4rem)] bg-[#131316] text-[#e4e1e6] flex items-center justify-center px-2 sm:px-4 lg:px-8 py-2 overflow-hidden select-none"
    >
      {/* Stitch Ambient Neon Glow Background Effects */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-60 bg-gradient-to-b from-[#ff5168]/15 via-[#b76dfd]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-[520px] h-64 bg-gradient-to-t from-[#00f1fd]/10 via-[#fe2c55]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1e24]/90 border border-[#00f1fd]/40 shadow-[0_0_20px_rgba(0,241,253,0.3)] text-white text-xs font-['Space_Grotesk'] font-medium flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={15} className="text-[#00f1fd]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Layout */}
      <div className="w-full max-w-[1240px] flex items-center justify-center gap-6 relative z-10">
        {/* Left Column (Desktop Only): Previous Video Preview & Shortcuts */}
        <div className="hidden xl:flex flex-col gap-4 items-end shrink-0 w-64 pr-2 opacity-90">
          {/* Live Feed Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1f1f22]/80 text-[#e6bcbd] font-['Space_Grotesk'] text-[11px] font-bold shadow-md border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#00f1fd] animate-ping" />
            <span>FEED TRỰC TIẾP</span>
          </div>

          {/* Previous Video Mini Preview Card */}
          {prevVideo ? (
            <div
              onClick={goToPrev}
              className="w-full bg-[#1b1b1e]/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl transition-all duration-300 hover:bg-[#2a2a2d] group cursor-pointer border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-['Space_Grotesk'] text-[#00f1fd] font-bold uppercase tracking-wider">
                  Video trước
                </span>
                <span className="material-symbols-outlined text-[#e6bcbd] text-[16px] group-hover:-translate-y-0.5 transition-transform">
                  arrow_upward
                </span>
              </div>
              <div className="flex gap-2.5 items-center">
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[#353438] relative">
                  <img
                    src={prevVideo.thumbnailUrl}
                    alt={prevVideo.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px]">play_arrow</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate">@{prevVideo.user.username}</p>
                  <p className="text-[12px] text-[#e6bcbd] truncate">{prevVideo.caption}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full p-3 rounded-2xl bg-[#1b1b1e]/40 border border-white/5 text-[12px] text-[#e6bcbd]/60 text-center font-['Space_Grotesk']">
              Đang ở đầu bảng tin
            </div>
          )}

          {/* Keyboard Shortcuts Guide Box */}
          <div className="w-full bg-[#1b1b1e]/80 backdrop-blur-xl rounded-2xl p-3.5 shadow-xl flex flex-col gap-2 border border-white/5">
            <div className="flex items-center gap-1.5 text-[#e4e1e6]">
              <span className="material-symbols-outlined text-[#00f1fd] text-[18px]">keyboard</span>
              <span className="text-[13px] font-['Space_Grotesk'] font-bold">Phím tắt thao tác</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="flex items-center justify-between bg-[#2a2a2d]/60 px-2 py-1.5 rounded-lg text-[11px] text-[#e6bcbd]">
                <span>Lên / Xuống</span>
                <kbd className="bg-[#1f1f22] text-[#00f2fe] px-1.5 py-0.5 rounded font-bold">▲ / ▼</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#2a2a2d]/60 px-2 py-1.5 rounded-lg text-[11px] text-[#e6bcbd]">
                <span>Thích video</span>
                <kbd className="bg-[#1f1f22] text-[#fe2c55] px-1.5 py-0.5 rounded font-bold">L</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#2a2a2d]/60 px-2 py-1.5 rounded-lg text-[11px] text-[#e6bcbd]">
                <span>Tắt tiếng</span>
                <kbd className="bg-[#1f1f22] text-white px-1.5 py-0.5 rounded font-bold">M</kbd>
              </div>
              <div className="flex items-center justify-between bg-[#2a2a2d]/60 px-2 py-1.5 rounded-lg text-[11px] text-[#e6bcbd]">
                <span>Tạm dừng</span>
                <kbd className="bg-[#1f1f22] text-white px-1.5 py-0.5 rounded font-bold">Space</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Center: The Active Video Card Component */}
        <div className="flex flex-col items-center">
          <VideoCard
            key={currentVideo.id}
            video={currentVideo}
            isActive={true}
            currentUserId={user?.id}
            onLikeToggle={onLikeToggle}
            onBookmarkToggle={onBookmarkToggle}
            onFollowToggle={onFollowToggle}
            onOpenComments={(v) => setCommentVideo(v)}
            onShare={handleShareClick}
            onRecordView={onRecordView}
            onPrevVideo={currentIndex > 0 ? goToPrev : undefined}
            onNextVideo={currentIndex < videos.length - 1 ? goToNext : undefined}
          />
        </div>

        {/* Right Column (Desktop Only): Next Video Auto-play Preview */}
        <div className="hidden xl:flex flex-col gap-4 items-start shrink-0 w-64 pl-2 opacity-90">
          {nextVideo ? (
            <div
              onClick={goToNext}
              className="w-full bg-[#1b1b1e]/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl transition-all duration-300 hover:bg-[#2a2a2d] group cursor-pointer border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-['Space_Grotesk'] text-[#ff5168] font-bold uppercase tracking-wider">
                  Tiếp theo
                </span>
                <span className="material-symbols-outlined text-[#e6bcbd] text-[16px] group-hover:translate-y-0.5 transition-transform">
                  arrow_downward
                </span>
              </div>
              <div className="flex gap-2.5 items-center">
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[#353438] relative">
                  <img
                    src={nextVideo.thumbnailUrl}
                    alt={nextVideo.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px]">play_arrow</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate">@{nextVideo.user.username}</p>
                  <p className="text-[12px] text-[#e6bcbd] truncate">{nextVideo.caption}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full p-3 rounded-2xl bg-[#1b1b1e]/40 border border-white/5 text-[12px] text-[#e6bcbd]/60 text-center font-['Space_Grotesk']">
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00f2fe]" />
                  <span>Đang tải thêm...</span>
                </div>
              ) : (
                'Đã xem hết video'
              )}
            </div>
          )}

          {/* Quick Counter Stats */}
          <div className="w-full bg-[#1b1b1e]/60 rounded-2xl p-3 border border-white/5 flex items-center justify-between text-[12px] font-['Space_Grotesk'] text-[#e6bcbd]">
            <span>Video đang xem:</span>
            <span className="text-[#00f2fe] font-bold">
              {currentIndex + 1} / {videos.length}
            </span>
          </div>
        </div>
      </div>

      {/* Slide-over Comments Drawer */}
      <CommentDrawer
        videoId={commentVideo?.id || null}
        videoCaption={commentVideo?.caption}
        isOpen={!!commentVideo}
        onClose={() => setCommentVideo(null)}
        onCommentAdded={(vId, newTotal) => {
          onCommentAdded?.(vId, newTotal);
        }}
      />
    </div>
  );
};
