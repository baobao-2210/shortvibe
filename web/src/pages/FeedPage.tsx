import React, { useRef } from 'react';
import { VideoFeed } from '../components/feed/VideoFeed';
import { useVideoFeed } from '../hooks/useVideoFeed';
import { likesApi, followsApi, videosApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, RefreshCw, Film } from 'lucide-react';

export const FeedPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const {
    videos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    updateVideoItem,
  } = useVideoFeed(10);

  // Debounce refs to prevent spamming like/follow requests
  const pendingLikesRef = useRef<Set<string>>(new Set());
  const pendingFollowsRef = useRef<Set<string>>(new Set());

  // Handle Like Toggle with real backend endpoint + optimistic UI rollback
  const handleLikeToggle = async (videoId: string, nextIsLiked: boolean) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (pendingLikesRef.current.has(videoId)) return;
    pendingLikesRef.current.add(videoId);

    // Optimistic UI update
    updateVideoItem(videoId, (prev) => ({
      ...prev,
      isLiked: nextIsLiked,
      likeCount: nextIsLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
    }));

    try {
      if (nextIsLiked) {
        await likesApi.like(videoId);
      } else {
        await likesApi.unlike(videoId);
      }
    } catch (err: any) {
      console.error('Like toggle error, rolling back:', err);
      // Rollback on failure
      updateVideoItem(videoId, (prev) => ({
        ...prev,
        isLiked: !nextIsLiked,
        likeCount: !nextIsLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
      }));
    } finally {
      pendingLikesRef.current.delete(videoId);
    }
  };

  // Handle Follow Toggle with real backend endpoint + optimistic UI rollback
  const handleFollowToggle = async (targetUserId: string, nextIsFollowing: boolean) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (user?.id === targetUserId) {
      alert('Bạn không thể tự theo dõi chính mình!');
      return;
    }

    if (pendingFollowsRef.current.has(targetUserId)) return;
    pendingFollowsRef.current.add(targetUserId);

    // Optimistic UI update for all videos by this author
    videos.forEach((v) => {
      if (v.user.id === targetUserId) {
        updateVideoItem(v.id, (prev) => ({
          ...prev,
          user: {
            ...prev.user,
            isFollowing: nextIsFollowing,
          },
        }));
      }
    });

    try {
      if (nextIsFollowing) {
        await followsApi.follow(targetUserId);
      } else {
        await followsApi.unfollow(targetUserId);
      }
    } catch (err: any) {
      console.error('Follow toggle error, rolling back:', err);
      // Rollback on failure
      videos.forEach((v) => {
        if (v.user.id === targetUserId) {
          updateVideoItem(v.id, (prev) => ({
            ...prev,
            user: {
              ...prev.user,
              isFollowing: !nextIsFollowing,
            },
          }));
        }
      });
    } finally {
      pendingFollowsRef.current.delete(targetUserId);
    }
  };

  // Section 7: View recording after >= 2 seconds of continuous viewing
  const handleRecordView = async (videoId: string) => {
    try {
      const res = await videosApi.recordView(videoId);
      if (res && typeof res.viewCount === 'number') {
        updateVideoItem(videoId, { viewCount: res.viewCount });
      }
    } catch (err) {
      // Non-critical background failure, do not disrupt user experience
      console.warn('View record event failed:', err);
    }
  };

  const handleCommentAdded = (videoId: string, newTotal: number) => {
    updateVideoItem(videoId, { commentCount: newTotal });
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] text-[#e4e1e6] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#fe2c55] border-r-[#00f2fe] animate-spin" />
          <Film className="w-6 h-6 text-[#fe2c55] absolute animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center font-['Space_Grotesk']">
          <span className="font-bold text-sm tracking-wide">Đang tải bảng tin ShortVibe...</span>
          <span className="text-xs text-white/50">Đang đồng bộ video mới nhất từ hệ thống</span>
        </div>
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error && videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] text-[#e4e1e6] px-4">
        <div className="max-w-md w-full bg-[#1b1b1e]/90 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#ff5168]/20 text-[#ff5168] flex items-center justify-center shadow-[0_0_24px_rgba(255,81,104,0.3)]">
            <AlertCircle size={28} />
          </div>

          <div className="space-y-1 font-['Space_Grotesk']">
            <h3 className="text-lg font-bold text-white">Không thể kết nối đến máy chủ</h3>
            <p className="text-xs text-white/60 leading-relaxed">{error}</p>
          </div>

          <button
            onClick={() => refresh()}
            className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] hover:brightness-110 active:scale-95 text-white font-bold text-xs font-['Space_Grotesk'] flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Thử tải lại</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] text-[#e4e1e6] px-4 font-['Space_Grotesk']">
        <div className="max-w-sm w-full bg-[#1b1b1e]/90 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl gap-3">
          <span className="material-symbols-outlined text-[48px] text-[#00f2fe]">movie</span>
          <h3 className="text-base font-bold text-white">Chưa có video công khai nào</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Hệ thống hiện tại chưa có video công khai. Hãy là người đầu tiên đăng tải video!
          </p>
          <button
            onClick={() => refresh()}
            className="mt-3 px-5 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Video Feed Render
  return (
    <div className="flex-1 w-full flex items-center justify-center">
      <VideoFeed
        videos={videos}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onLikeToggle={handleLikeToggle}
        onFollowToggle={handleFollowToggle}
        onRecordView={handleRecordView}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};
