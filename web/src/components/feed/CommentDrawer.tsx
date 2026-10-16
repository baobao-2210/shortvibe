import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commentsApi, CommentItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Send, Loader2, MessageSquare, ExternalLink } from 'lucide-react';

interface CommentDrawerProps {
  videoId: string | null;
  videoCaption?: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (videoId: string, newCount: number) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  videoId,
  videoCaption,
  isOpen,
  onClose,
  onCommentAdded,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments when open and videoId changes
  useEffect(() => {
    if (!isOpen || !videoId) return;

    let isMounted = true;
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await commentsApi.getByVideo(videoId, 1, 50);
        if (isMounted) {
          setComments(res.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load comments:', err);
          setError('Không thể tải bình luận. Vui lòng thử lại.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [isOpen, videoId]);

  if (!isOpen || !videoId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await commentsApi.createComment(videoId, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setNewComment('');
      onCommentAdded?.(videoId, comments.length + 1);
    } catch (err: any) {
      console.error('Error submitting comment:', err);
      alert('Không thể gửi bình luận. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'Vừa xong';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} phút trước`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content box */}
      <div className="relative z-10 w-full sm:max-w-md h-[75vh] sm:h-[600px] bg-[#16161a] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#e4e1e6]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-[#1a1a1f]">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#00f2fe]" />
            <h3 className="font-['Space_Grotesk'] font-bold text-sm tracking-wide">
              Bình luận ({comments.length})
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                navigate(`/video/${videoId}`);
              }}
              title="Mở toàn trang"
              className="p-1.5 rounded-full hover:bg-white/10 text-[#e6bcbd] hover:text-white transition-colors"
            >
              <ExternalLink size={16} />
            </button>
            <button
              onClick={onClose}
              title="Đóng"
              className="p-1.5 rounded-full hover:bg-white/10 text-[#e6bcbd] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video caption preview */}
        {videoCaption && (
          <div className="px-5 py-2.5 bg-[#121215] border-b border-white/5 text-xs text-[#e6bcbd]/80 line-clamp-1 italic">
            "{videoCaption}"
          </div>
        )}

        {/* Comments list container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-white/60">
              <Loader2 className="w-6 h-6 animate-spin text-[#00f2fe]" />
              <span className="text-xs font-['Space_Grotesk']">Đang tải bình luận...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-red-400 gap-2">
              <p>{error}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-white/50 gap-2 font-['Space_Grotesk']">
              <span className="material-symbols-outlined text-[36px] text-white/30">forum</span>
              <p className="text-sm font-semibold text-white/80">Chưa có bình luận nào</p>
              <p className="text-xs text-white/50">Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs">
                <img
                  src={
                    comment.user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  }
                  alt={comment.user?.username || 'user'}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white hover:underline cursor-pointer">
                      @{comment.user?.username || 'user'}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/90 leading-relaxed break-words">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input footer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-white/10 bg-[#1a1a1f] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              isAuthenticated
                ? 'Thêm bình luận của bạn...'
                : 'Đăng nhập để tham gia bình luận...'
            }
            onClick={() => {
              if (!isAuthenticated) openAuthModal('login');
            }}
            className="flex-1 bg-[#121215] border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00f2fe] transition-colors"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
