import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { videosApi, commentsApi, likesApi, followsApi, VideoItem, CommentItem, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Copy,
  Send,
  MessageCircle,
  CheckCircle,
  Loader2,
  Smile,
  AtSign,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

export const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Player controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    return sessionStorage.getItem('shortvibe_unmuted') !== 'true';
  });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:20');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);

  // Interactive stats
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit & Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch video detail
        const videoData = await videosApi.getVideoById(id);
        const authorObj = videoData.author || videoData.user;
        const normalizedVideo = {
          ...videoData,
          author: {
            id: authorObj?.id || videoData.userId,
            username: authorObj?.username || 'creator',
            fullName: authorObj?.fullName || authorObj?.displayName || authorObj?.username || 'Creator',
            avatarUrl: authorObj?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            bio: authorObj?.bio || '',
          },
        };
        setVideo(normalizedVideo);
        if (normalizedVideo.durationSeconds) {
          setDuration(formatTime(normalizedVideo.durationSeconds));
        }
        setIsLiked(videoData.isLiked || false);
        setLikeCount(videoData.likeCount || 0);
        setIsFollowing(videoData.isFollowing || false);

        // Fetch comments
        const commentsData = await commentsApi.getByVideo(id);
        setComments(commentsData.data || []);
      } catch (err) {
        console.warn('Failed to load video or comments from backend:', err);
        // Fallback placeholder data if ID not in DB
        setVideo({
          id: id,
          userId: 'creator-demo',
          caption: 'Bật mí góc làm việc và hiệu ứng ánh sáng neon studio cực đỉnh! 🔥 #ShortVibe #TechReview #NeonSaigon',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
          durationSeconds: 35,
          viewsCount: 142000,
          visibility: 'PUBLIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: 'creator1',
            username: 'linhdan.vibe',
            fullName: 'Linh Đan ✨',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            bio: 'Content Creator • Saigon Vibes',
          },
          likeCount: 14200,
          commentCount: 85,
          isLiked: false,
          isFollowing: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Video Time formatting
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!isNaN(dur) && dur > 1) {
      setDuration(formatTime(dur));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    const total = !isNaN(dur) && dur > 1 ? dur : (video?.durationSeconds || 20);
    setProgress((current / total) * 100);
    setCurrentTime(formatTime(current));
    setDuration(formatTime(total));
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = newProgress * videoRef.current.duration;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isMuted || videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      sessionStorage.setItem('shortvibe_unmuted', 'true');
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      sessionStorage.setItem('shortvibe_unmuted', 'true');
    } else {
      sessionStorage.removeItem('shortvibe_unmuted');
    }
  };

  const toggleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  // Interactions
  const handleLike = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!video) return;

    try {
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        await likesApi.unlike(video.id);
      } else {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        await likesApi.like(video.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!video) return;

    try {
      if (isFollowing) {
        setIsFollowing(false);
        await followsApi.unfollow(video.author.id);
      } else {
        setIsFollowing(true);
        await followsApi.follow(video.author.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!video) return;

    setIsSubmitting(true);
    try {
      const created = await commentsApi.createComment(video.id, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveEdit = async () => {
    if (!video) return;
    setIsSavingEdit(true);
    try {
      const res = await videosApi.updateVideo(video.id, {
        caption: editCaption.trim(),
        visibility: editVisibility,
      });
      setVideo((prev) =>
        prev
          ? {
              ...prev,
              caption: editCaption.trim(),
              visibility: editVisibility,
            }
          : prev
      );
      setIsEditModalOpen(false);
      alert('Đã cập nhật thông tin video thành công!');
    } catch (err: any) {
      console.error('Failed to update video:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật video. Vui lòng thử lại.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!video) return;
    setIsDeleting(true);
    try {
      await videosApi.deleteVideo(video.id);
      setIsDeleteModalOpen(false);
      alert('Đã xóa video thành công!');
      navigate(`/profile/${user?.id || ''}`);
    } catch (err: any) {
      console.error('Failed to delete video:', err);
      alert(err.response?.data?.message || 'Không thể xóa video. Vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <span className="font-label text-sm text-on-surface">Đang tải chi tiết video...</span>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-on-surface font-semibold mb-4">Không tìm thấy video này</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-primary text-white font-medium text-sm"
        >
          Quay lại bảng tin
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-background">
      {/* =========================================================================
       * LEFT COLUMN (65%): VIDEO PLAYER & CONSOLE
       * ========================================================================= */}
      <div className="w-full lg:w-[65%] min-h-[60vh] lg:min-h-full flex flex-col items-center justify-between p-4 lg:p-6 relative bg-surface-container-lowest/80 border-r border-surface-container-highest/40">
        {/* Top Floating Back Bar */}
        <div className="w-full flex items-center justify-between z-20 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container/80 backdrop-blur-md text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-surface-container/80 backdrop-blur-md text-secondary-fixed text-xs font-label font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
              4K HDR
            </span>
          </div>
        </div>

        {/* Video Player Display Container (9:16 Aspect) */}
        <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex items-center justify-center group">
          <video
            ref={videoRef}
            src={resolveMediaUrl(video.videoUrl)}
            poster={resolveMediaUrl(video.thumbnailUrl)}
            autoPlay
            loop={isLooping}
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              // Auto-fallback if the URL cannot be decoded by browser
              const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
              if (e.currentTarget.src !== fallbackUrl) {
                e.currentTarget.src = fallbackUrl;
                e.currentTarget.play().catch(() => {});
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Floating Actions on Video Right Edge */}
          <div className="absolute right-3 bottom-12 flex flex-col items-center gap-4 z-20">
            {/* Like */}
            <button
              onClick={handleLike}
              className="group/btn flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div
                className={`w-11 h-11 rounded-full backdrop-blur-xl flex items-center justify-center shadow-lg transition-all ${
                  isLiked
                    ? 'bg-primary text-white shadow-[0_0_16px_rgba(254,44,85,0.6)]'
                    : 'bg-surface-container/70 text-white group-hover/btn:scale-110'
                }`}
              >
                <Heart size={22} className={isLiked ? 'fill-white' : ''} />
              </div>
              <span className="text-[11px] font-label font-bold text-white drop-shadow">
                {likeCount > 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
              </span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="group/btn flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div
                className={`w-11 h-11 rounded-full backdrop-blur-xl flex items-center justify-center shadow-lg transition-all ${
                  isBookmarked
                    ? 'bg-secondary-container text-black shadow-[0_0_16px_rgba(0,242,254,0.6)]'
                    : 'bg-surface-container/70 text-white group-hover/btn:scale-110'
                }`}
              >
                <Bookmark size={22} className={isBookmarked ? 'fill-current' : ''} />
              </div>
              <span className="text-[11px] font-label font-bold text-white drop-shadow">
                Lưu
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleCopyLink}
              className="group/btn flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className="w-11 h-11 rounded-full bg-surface-container/70 backdrop-blur-xl flex items-center justify-center text-white shadow-lg group-hover/btn:scale-110">
                <Share2 size={22} />
              </div>
              <span className="text-[11px] font-label font-bold text-white drop-shadow">
                Chia sẻ
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM CONSOLE: Playback Scrubber, Speed, Loop, Volume */}
        <div className="w-full max-w-xl bg-surface-container/80 backdrop-blur-2xl rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 mt-4 border border-surface-container-highest/40">
          {/* Scrubber Progress Bar */}
          <div
            onClick={handleScrubberClick}
            className="relative w-full group/scrubber cursor-pointer py-1 flex items-center"
          >
            <div className="w-full h-1.5 group-hover/scrubber:h-2 rounded-full bg-surface-container-highest relative overflow-hidden transition-all duration-150">
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary-container via-primary to-secondary-container rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3 text-on-surface">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1 rounded-full text-primary hover:bg-surface-container-high transition-colors"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="fill-primary" />}
              </button>
              <div className="flex items-center gap-1 font-label text-xs">
                <span className="font-bold text-white">{currentTime}</span>
                <span className="text-on-surface-variant/50">/</span>
                <span className="text-on-surface-variant">{duration}</span>
              </div>
            </div>

            {/* Equalizer Indicator */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high/60">
              <span className="w-1 h-3 rounded-full bg-secondary-container animate-pulse" />
              <span className="w-1 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 rounded-full bg-secondary-container animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="font-sans text-xs text-secondary-container ml-1 truncate max-w-[140px]">
                {video.author.username} • Âm thanh gốc
              </span>
            </div>

            {/* Volume, Speed, Loop */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <button
                onClick={toggleSpeed}
                className="px-2 py-0.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-white font-label text-xs uppercase font-bold"
              >
                {playbackSpeed}x
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-full transition-colors ${
                  isLooping
                    ? 'bg-surface-container-high text-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Repeat size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * RIGHT COLUMN (35%): DEDICATED CONTEXTUAL PANEL (AUTHOR & COMMENTS)
       * ========================================================================= */}
      <div className="w-full lg:w-[35%] flex flex-col bg-surface-container-low shadow-2xl relative z-30 min-h-[500px]">
        {/* TOP CREATOR HEADER */}
        <div className="p-5 border-b border-surface-container-highest/40 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={`/profile/${video.author.id}`}
              className="flex items-center gap-3 min-w-0 group"
            >
              <div className="relative shrink-0">
                <img
                  src={video.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={video.author.username}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40 group-hover:ring-secondary-container transition-all"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-[10px]">
                  ★
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                    {video.author.fullName || video.author.username}
                  </h3>
                  <CheckCircle size={14} className="text-secondary-container fill-secondary-container/20 shrink-0" />
                </div>
                <p className="text-xs text-on-surface-variant truncate">@{video.author.username}</p>
              </div>
            </Link>

            <button
              onClick={handleFollow}
              type="button"
              className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${
                isFollowing
                  ? 'bg-surface-container-high text-on-surface border border-surface-container-highest'
                  : 'bg-primary text-white hover:bg-primary-container shadow-[0_0_12px_rgba(254,44,85,0.4)]'
              }`}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </button>
          </div>

          {/* Caption */}
          <p className="text-sm text-on-surface leading-relaxed mt-1">{video.caption}</p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center pt-2 bg-surface-container/40 p-2.5 rounded-xl border border-surface-container-highest/30">
            <div>
              <span className="block font-bold text-sm text-primary">{likeCount}</span>
              <span className="text-[10px] uppercase font-label text-on-surface-variant">Thích</span>
            </div>
            <div>
              <span className="block font-bold text-sm text-white">{comments.length}</span>
              <span className="text-[10px] uppercase font-label text-on-surface-variant">Bình luận</span>
            </div>
            <div>
              <span className="block font-bold text-sm text-secondary-container">1.2K</span>
              <span className="text-[10px] uppercase font-label text-on-surface-variant">Đã lưu</span>
            </div>
            <div>
              <span className="block font-bold text-sm text-tertiary">350</span>
              <span className="text-[10px] uppercase font-label text-on-surface-variant">Chia sẻ</span>
            </div>
          </div>

          {/* Copy link row */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface transition-colors"
            >
              <Copy size={14} className="text-secondary-container" />
              <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép link'}</span>
            </button>
            <span className="text-xs text-on-surface-variant/70">Chia sẻ ngay</span>
          </div>

          {/* Owner Management Buttons */}
          {user?.id && (user.id === video.author.id || user.id === video.userId) && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high/60 border border-surface-container-highest/40 mt-2">
              <span className="text-xs font-semibold text-white/80">Quản lý video của bạn:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditCaption(video.caption || '');
                    setEditVisibility(video.visibility || 'PUBLIC');
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-[#00f2fe]/20 hover:text-[#00f2fe] text-xs text-white transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#fe2c55]/20 hover:bg-[#fe2c55]/30 text-xs text-[#fe2c55] transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB SELECTION BAR */}
        <div className="flex items-center px-5 border-b border-surface-container-highest/40 bg-surface-container-low">
          <button className="py-3 px-2 font-bold text-sm text-primary relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary">
            Bình luận ({comments.length})
          </button>
        </div>

        {/* SCROLLABLE COMMENTS THREAD CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px] no-scrollbar">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 group">
                <img
                  src={c.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={c.user?.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">
                      {c.user?.fullName || c.user?.username}
                    </span>
                    <span className="text-[11px] text-on-surface-variant/60">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface mt-1 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM COMMENT INPUT FORM */}
        <div className="p-3.5 bg-surface-container border-t border-surface-container-highest/40">
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? 'Thêm bình luận cho video...' : 'Đăng nhập để bình luận...'}
              disabled={!isAuthenticated || isSubmitting}
              className="flex-1 h-10 px-3.5 rounded-full bg-surface-container-high border border-surface-container-highest/60 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary-container transition-all"
            />

            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="h-10 px-4 rounded-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1 transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Đăng</span>
                  <Send size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Video Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#18181c] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-['Space_Grotesk'] font-bold text-base flex items-center gap-2">
                <Edit3 size={18} className="text-[#00f2fe]" />
                <span>Chỉnh sửa thông tin video</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-white/80">Mô tả video & Hashtags</label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full bg-[#121215] border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#00f2fe]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white/80">Quyền riêng tư</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditVisibility('PUBLIC')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      editVisibility === 'PUBLIC'
                        ? 'border-[#00f2fe] bg-[#00f2fe]/10 text-[#00f2fe]'
                        : 'border-white/10 bg-[#121215] text-white/60'
                    }`}
                  >
                    <span className="font-bold">Công khai (Public)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility('PRIVATE')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      editVisibility === 'PRIVATE'
                        ? 'border-[#fe2c55] bg-[#fe2c55]/10 text-[#fe2c55]'
                        : 'border-white/10 bg-[#121215] text-white/60'
                    }`}
                  >
                    <span className="font-bold">Riêng tư (Private)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5"
              >
                {isSavingEdit ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#18181c] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#fe2c55]/20 text-[#fe2c55] flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(254,44,85,0.4)]">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-['Space_Grotesk'] font-bold text-base text-white">
                Xác nhận xóa video?
              </h3>
              <p className="text-xs text-white/60">
                Thao tác này sẽ xóa vĩnh viễn video khỏi ShortVibe và không thể khôi phục lại.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteVideo}
                disabled={isDeleting}
                className="px-6 py-2 rounded-full bg-[#fe2c55] hover:bg-[#ff5168] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
