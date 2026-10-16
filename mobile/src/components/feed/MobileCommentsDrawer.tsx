import React, { useState, useEffect } from 'react';
import { commentsApi, CommentItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Send, Trash2 } from 'lucide-react';

interface MobileCommentsDrawerProps {
  videoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

export const MobileCommentsDrawer: React.FC<MobileCommentsDrawerProps> = ({
  videoId,
  isOpen,
  onClose,
  onCommentCountChange,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!videoId || !isOpen) return;

    let isMounted = true;
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await commentsApi.getVideoComments(videoId, 1, 50);
        if (isMounted) {
          setComments(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [videoId, isOpen]);

  if (!isOpen || !videoId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const trimmed = newComment.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const added = await commentsApi.addComment(videoId, trimmed);
      setComments((prev) => [added, ...prev]);
      setNewComment('');
      onCommentCountChange?.(comments.length + 1);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(Math.max(0, comments.length - 1));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface-container rounded-t-3xl border-t border-surface-container-highest flex flex-col max-h-[70vh] h-[70vh] safe-pb z-10 shadow-2xl">
        {/* Header */}
        <div className="relative py-3 px-4 border-b border-surface-container-highest/60 flex items-center justify-between shrink-0">
          <div className="w-10" />
          <h3 className="text-sm font-bold text-on-surface">
            {comments.length} bình luận
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          ) : (
            comments.map((comment) => {
              const isOwner = user?.id === comment.userId;
              return (
                <div key={comment.id} className="flex items-start gap-2.5 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest shrink-0">
                    {comment.user?.avatarUrl ? (
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary bg-primary/10">
                        {(comment.user?.displayName || comment.user?.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-on-surface">
                        {comment.user?.displayName || comment.user?.username}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70">
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface mt-0.5 break-words">{comment.content}</p>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-on-surface-variant hover:text-error transition-colors shrink-0"
                      title="Xóa bình luận"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Comment Input */}
        <div className="p-3 border-t border-surface-container-highest/60 bg-surface-container shrink-0">
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Thêm bình luận..."
                className="flex-1 h-9 px-3.5 rounded-full bg-surface-container-lowest text-xs text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 shadow-sm"
              >
                <Send size={15} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2 rounded-xl bg-surface-container-high text-xs text-primary font-bold text-center hover:bg-surface-container-highest transition-colors"
            >
              Đăng nhập để bình luận
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
