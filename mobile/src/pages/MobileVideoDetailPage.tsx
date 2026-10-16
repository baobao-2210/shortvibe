import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Plus,
  Music2,
} from 'lucide-react';
import {
  videosApi,
  likesApi,
  followsApi,
  VideoItem,
  resolveMediaUrl,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MobileCommentsDrawer } from '../components/feed/MobileCommentsDrawer';

export const MobileVideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    videosApi
      .getVideoById(id)
      .then((data) => {
        if (isMounted) {
          setVideo(data);
          videosApi.recordView(id).catch(() => {});
        }
      })
      .catch((err) => console.error('Failed to load video:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!video) return;

    const prevLiked = video.isLiked;
    const prevCount = video.likeCount;

    setVideo({
      ...video,
      isLiked: !prevLiked,
      likeCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    });

    try {
      if (prevLiked) {
        await likesApi.unlikeVideo(video.id);
      } else {
        await likesApi.likeVideo(video.id);
      }
    } catch {
      setVideo({ ...video, isLiked: prevLiked, likeCount: prevCount });
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!video || !video.userId) return;

    const prevFollow = video.isFollowing;
    setVideo({ ...video, isFollowing: !prevFollow });

    try {
      if (prevFollow) {
        await followsApi.unfollow(video.userId);
      } else {
        await followsApi.follow(video.userId);
      }
    } catch {
      setVideo({ ...video, isFollowing: prevFollow });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-white text-center gap-3">
        <p className="text-sm">Video không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-full bg-surface-container text-xs font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const author = video.user;

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* Top Header with Back Button */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 safe-pt text-white pointer-events-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 active:scale-95"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Video Player */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={resolveMediaUrl(video.videoUrl)}
          poster={resolveMediaUrl(video.thumbnailUrl)}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Actions */}
      <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4">
        {/* Author Avatar with Follow Plus */}
        <div className="relative mb-1">
          <div
            onClick={() => author?.id && navigate(`/profile/${author.id}`)}
            className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-primary to-secondary cursor-pointer"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-surface">
              {author?.avatarUrl ? (
                <img
                  src={resolveMediaUrl(author.avatarUrl)}
                  alt={author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-primary">
                  {(author?.displayName || author?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {!video.isFollowing && author?.id !== user?.id && (
            <button
              onClick={handleFollowToggle}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-md"
            >
              <Plus size={11} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Like */}
        <div className="flex flex-col items-center">
          <button onClick={handleLikeToggle} className="p-2 active:scale-75 transition-transform">
            <Heart
              size={30}
              className={video.isLiked ? 'text-primary fill-primary' : 'text-white'}
            />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">
            {video.likeCount}
          </span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="p-2 active:scale-75 transition-transform"
          >
            <MessageCircle size={28} className="text-white" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">
            {video.commentCount}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ url: window.location.href }).catch(() => {});
              }
            }}
            className="p-2 active:scale-75 transition-transform"
          >
            <Share2 size={26} className="text-white" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Chia sẻ</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute left-4 right-16 bottom-8 z-20 text-white space-y-2 pointer-events-none">
        <div
          onClick={() => author?.id && navigate(`/profile/${author.id}`)}
          className="inline-flex items-center gap-1.5 pointer-events-auto cursor-pointer"
        >
          <span className="text-sm font-bold drop-shadow-md hover:underline">
            @{author?.username || 'user'}
          </span>
        </div>

        <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md font-medium">
          {video.caption || 'Video ShortVibe'}
        </p>

        <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
          <Music2 size={13} className="shrink-0" />
          <span className="truncate drop-shadow-md">
            Âm thanh gốc - @{author?.username || 'shortvibe'}
          </span>
        </div>
      </div>

      {/* Comments Drawer */}
      <MobileCommentsDrawer
        videoId={video.id}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        onCommentCountChange={(c) => setVideo({ ...video, commentCount: c })}
      />
    </div>
  );
};
