import React, { useRef, useState, useEffect } from 'react';
import { VideoItem } from '../../types/video';
import { ActionSidebar } from './ActionSidebar';
import { resolveMediaUrl } from '../../services/api';

interface VideoCardProps {
  video: VideoItem;
  isActive?: boolean;
  isAdjacent?: boolean;
  currentUserId?: string;
  onLikeToggle?: (videoId: string, isLiked: boolean) => void;
  onBookmarkToggle?: (videoId: string, isBookmarked: boolean) => void;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  onOpenComments?: (video: VideoItem) => void;
  onShare?: (video: VideoItem) => void;
  onRecordView?: (videoId: string) => void;
  onPrevVideo?: () => void;
  onNextVideo?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isActive = true,
  isAdjacent = false,
  currentUserId,
  onLikeToggle,
  onBookmarkToggle,
  onFollowToggle,
  onOpenComments,
  onShare,
  onRecordView,
  onPrevVideo,
  onNextVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedViewRef = useRef<boolean>(false);

  // Local state for interaction toggles
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return sessionStorage.getItem('shortvibe_unmuted') !== 'true';
  });
  const [progress, setProgress] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('0:00');

  // Pre-fill duration from video metadata or durationSeconds prop
  const initialDur = video.durationSeconds && video.durationSeconds > 1 ? video.durationSeconds : 20;
  const initMins = Math.floor(initialDur / 60);
  const initSecs = Math.floor(initialDur % 60);
  const [durationStr, setDurationStr] = useState<string>(
    `${initMins}:${initSecs < 10 ? '0' : ''}${initSecs}`
  );
  const [showCenterIcon, setShowCenterIcon] = useState<boolean>(false);

  // Like & Bookmark & Follow local states synced from props
  const [isLiked, setIsLiked] = useState<boolean>(video.isLiked || false);
  const [likeCount, setLikeCount] = useState<number>(video.likeCount || 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(video.isBookmarked || false);
  const [bookmarkCount, setBookmarkCount] = useState<number>(video.bookmarkCount || 0);
  const [isFollowing, setIsFollowing] = useState<boolean>(video.user.isFollowing || false);

  useEffect(() => {
    setIsLiked(video.isLiked || false);
    setLikeCount(video.likeCount || 0);
    setIsFollowing(video.user.isFollowing || false);
  }, [video.isLiked, video.likeCount, video.user.isFollowing]);

  // Synchronize active playback & View counting logic (>= 2s)
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      // Check if user previously unmuted
      const userUnmuted = sessionStorage.getItem('shortvibe_unmuted') === 'true';
      videoRef.current.muted = !userUnmuted;
      setIsMuted(!userUnmuted);

      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay policy fallback: mute and play
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });

      // Section 7: View Counting (>= 2s of continuous viewing)
      if (!hasRecordedViewRef.current) {
        if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
        viewTimerRef.current = setTimeout(() => {
          hasRecordedViewRef.current = true;
          onRecordView?.(video.id);
        }, 2000);
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);

      // Cancel view timer if scrolled away before 2s
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    }

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [isActive, video.id, onRecordView]);

  // Handle browser tab switch (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (isActive) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    // If currently muted, clicking the video also un-mutes to play sound immediately
    if (isMuted || videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      sessionStorage.setItem('shortvibe_unmuted', 'true');
    }

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 600);
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);

    if (!newMuted) {
      sessionStorage.setItem('shortvibe_unmuted', 'true');
    } else {
      sessionStorage.removeItem('shortvibe_unmuted');
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!isNaN(dur) && dur > 1) {
      const durMins = Math.floor(dur / 60);
      const durSecs = Math.floor(dur % 60);
      setDurationStr(`${durMins}:${durSecs < 10 ? '0' : ''}${durSecs}`);
    }
  };

  const handleVideoError = () => {
    console.warn(`Video ${video.id} error loading: ${video.videoUrl}. Falling back to default.`);
    if (videoRef.current) {
      videoRef.current.src =
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    const total = !isNaN(dur) && dur > 1 ? dur : video.durationSeconds || 20;
    setProgress((current / total) * 100);

    const curMins = Math.floor(current / 60);
    const curSecs = Math.floor(current % 60);
    setCurrentTimeStr(`${curMins}:${curSecs < 10 ? '0' : ''}${curSecs}`);

    const durMins = Math.floor(total / 60);
    const durSecs = Math.floor(total % 60);
    setDurationStr(`${durMins}:${durSecs < 10 ? '0' : ''}${durSecs}`);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const handleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    onLikeToggle?.(video.id, nextState);
  };

  const handleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setBookmarkCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    onBookmarkToggle?.(video.id, nextState);
  };

  const handleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    onFollowToggle?.(video.user.id, nextState);
  };

  // Format relative time (e.g. "Vừa xong", "2 giờ trước")
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'Vừa xong';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} phút trước`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} giờ trước`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Render caption with highlighted #hashtags
  const renderCaption = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_\u00C0-\u1EF9]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-[#00f2fe] font-semibold hover:underline cursor-pointer">
            {part}{' '}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isOwnVideo = currentUserId && currentUserId === video.user.id;

  return (
    <div className="relative flex items-center justify-center select-none py-2">
      {/* 1. Main 9:16 Video Player Container */}
      <div className="relative w-[340px] sm:w-[380px] md:w-[420px] lg:w-[460px] h-[calc(100vh-6.5rem)] max-h-[820px] rounded-3xl overflow-hidden bg-[#0e0e11] shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between group/player border border-[#353438]/40">
        {/* Background Video Element */}
        <div className="absolute inset-0 z-0 bg-black cursor-pointer" onClick={togglePlayPause}>
          <video
            ref={videoRef}
            src={resolveMediaUrl(video.videoUrl)}
            poster={resolveMediaUrl(video.thumbnailUrl)}
            loop
            playsInline
            preload={isActive ? 'auto' : isAdjacent ? 'metadata' : 'none'}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            className="w-full h-full object-cover scale-100 group-hover/player:scale-[1.01] transition-transform duration-700 ease-out"
          />

          {/* Stitch Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/30 to-[#0e0e11]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e11]/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Top Header Overlay */}
        <div className="relative z-20 flex items-center justify-between p-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0e11]/70 backdrop-blur-md text-white text-[12px] font-semibold font-['Space_Grotesk'] shadow-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#ff5168] animate-pulse" />
              <span>Dành cho bạn</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#2a2a2d]/60 backdrop-blur-md text-[#00f2fe] text-[11px] font-bold font-['Space_Grotesk'] flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[13px]">hd</span>
              <span>4K HDR</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label="Tắt/Bật âm lượng"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer ${
                isMuted
                  ? 'bg-primary text-white font-bold text-xs ring-2 ring-primary/50 animate-pulse'
                  : 'bg-[#0e0e11]/70 hover:bg-[#2a2a2d]/80 text-[#e4e1e6] text-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
              <span className="font-['Space_Grotesk'] text-[11px] font-semibold">
                {isMuted ? 'Bật tiếng (M)' : 'Âm thanh'}
              </span>
            </button>
            <button
              type="button"
              aria-label="Tùy chọn khác"
              onClick={() => onShare?.(video)}
              className="w-9 h-9 rounded-full bg-[#0e0e11]/60 hover:bg-[#2a2a2d]/80 text-[#e4e1e6] backdrop-blur-md flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
          </div>
        </div>

        {/* 3. Center Play / Pause Indicator */}
        <div className="relative z-10 flex-1 flex items-center justify-center cursor-pointer pointer-events-none">
          <div
            className={`w-16 h-16 rounded-full bg-[#0e0e11]/60 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-300 shadow-2xl border border-white/10 ${
              showCenterIcon ? 'opacity-100 scale-110' : !isPlaying ? 'opacity-90' : 'opacity-0'
            }`}
          >
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </div>
        </div>

        {/* 4. Bottom Information & Controls */}
        <div className="relative z-20 p-4 pt-0 flex flex-col gap-2 bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/90 to-transparent pointer-events-auto">
          {/* Author Name & Caption */}
          <div className="space-y-1.5 max-w-[90%]">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`#@${video.user.username}`}
                className="text-[16px] text-white hover:text-[#fe2c55] transition-colors flex items-center gap-1 font-bold drop-shadow-md"
              >
                <span>{video.user.displayName}</span>
                {video.user.isVerified && (
                  <span
                    className="material-symbols-outlined text-[#00f1fd] text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                )}
              </a>
              <span className="text-[12px] text-[#e6bcbd]/80 font-['Space_Grotesk']">
                · {formatRelativeTime(video.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`#@${video.user.username}`}
                className="text-[13px] text-[#00f2fe] font-['Space_Grotesk'] hover:underline inline-block drop-shadow-sm font-medium"
              >
                @{video.user.username}
              </a>
              <span className="text-[11px] text-white/50">
                {video.viewCount.toLocaleString()} lượt xem
              </span>
            </div>

            <p className="text-[14px] text-[#e4e1e6] leading-snug drop-shadow-md line-clamp-3">
              {renderCaption(video.caption)}
            </p>

            {/* Sound bar pill */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a2d]/70 backdrop-blur-lg text-white text-[12px] max-w-full overflow-hidden shadow-md border border-white/5">
                <span className="material-symbols-outlined text-[#00f1fd] text-[16px] animate-[spin_4s_linear_infinite]">
                  music_note
                </span>
                <div className="overflow-hidden whitespace-nowrap max-w-[220px]">
                  <span className="inline-block font-medium truncate">
                    {video.soundTitle || 'Âm thanh gốc - ShortVibe Music'}
                  </span>
                </div>
                {/* Visualizer bars */}
                <div className="flex items-end gap-0.5 h-3 shrink-0 ml-1">
                  <span className="w-0.5 h-2.5 bg-[#00f1fd] rounded-full animate-pulse" />
                  <span
                    className="w-0.5 h-3.5 bg-[#00f1fd] rounded-full animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-0.5 h-2 bg-[#00f1fd] rounded-full animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress / Scrubber Bar */}
          <div className="pt-2 flex flex-col gap-1">
            <div
              className="group/scrub relative w-full h-3 flex items-center cursor-pointer"
              onClick={handleScrubberClick}
            >
              <div className="w-full h-1 group-hover/scrub:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200">
                <div
                  className="h-full bg-gradient-to-r from-[#ff5168] via-[#fe2c55] to-[#00f1fd] rounded-full relative"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div
                className="absolute -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(0,241,253,0.9)] opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progress}%` }}
              />
            </div>

            {/* Bottom time & controls */}
            <div className="flex items-center justify-between text-[#e6bcbd] text-[11px] font-['Space_Grotesk'] font-medium">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <span>
                  {currentTimeStr} / {durationStr}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-[#2a2a2d]/60 px-1.5 py-0.5 rounded text-[10px] text-white/80">
                  HD
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current?.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Sidebar (Right side vertical menu) */}
      <ActionSidebar
        user={video.user}
        likeCount={likeCount}
        commentCount={video.commentCount}
        bookmarkCount={bookmarkCount}
        shareCount={video.shareCount}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        isFollowing={isFollowing || isOwnVideo}
        onToggleLike={handleLike}
        onToggleBookmark={handleBookmark}
        onToggleFollow={isOwnVideo ? undefined : handleFollow}
        onOpenComments={() => onOpenComments?.(video)}
        onShare={() => onShare?.(video)}
        onPrevVideo={onPrevVideo}
        onNextVideo={onNextVideo}
      />
    </div>
  );
};
