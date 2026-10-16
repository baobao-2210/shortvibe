import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Bell,
  CheckCheck,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  notificationsApi,
  NotificationItem,
  NotificationType,
  resolveMediaUrl,
} from '../services/api';

export const MobileInboxPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | NotificationType>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (showLoading = true) => {
    if (!isAuthenticated) return;
    if (showLoading) setIsLoading(true);
    try {
      const typeParam = filter === 'ALL' ? undefined : filter;
      const res = await notificationsApi.getNotifications(1, 40, typeParam);
      setNotifications(res.data || []);
      if (res.meta?.unreadCount !== undefined) {
        setUnreadCount(res.meta.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, filter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationsApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    if (item.videoId) {
      navigate(`/video/${item.videoId}`);
    } else if (item.actorId) {
      navigate(`/profile/${item.actorId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-background">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-lg shadow-primary/10">
          <Bell size={40} />
        </div>
        <h2 className="text-lg font-bold text-on-surface">Hộp thư thông báo</h2>
        <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
          Đăng nhập để xem thông báo về lượt thích, bình luận, người theo dõi và lượt nhắc tên mới nhất của bạn.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-7 py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-on-surface overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 safe-pt bg-surface/90 backdrop-blur-md border-b border-surface-container-highest/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount} mới
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-semibold text-secondary flex items-center gap-1 active:opacity-70 px-2 py-1 rounded-lg bg-surface-container"
              title="Đọc tất cả"
            >
              <CheckCheck size={14} />
              <span>Đọc tất cả</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-full text-on-surface-variant hover:text-white hover:bg-surface-container transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar border-b border-surface-container-highest/40 bg-surface/40 shrink-0">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'LIKE', label: 'Lượt thích' },
          { key: 'COMMENT', label: 'Bình luận' },
          { key: 'MENTION', label: 'Nhắc đến' },
          { key: 'FOLLOW', label: 'Follower' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === tab.key
                ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5 pb-28">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-on-surface-variant text-xs">
            <Loader2 size={26} className="animate-spin text-primary" />
            <span>Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant text-xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant/50">
              <Bell size={26} />
            </div>
            <p className="font-bold text-sm text-on-surface">Không có thông báo nào</p>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              {filter === 'ALL'
                ? 'Khi có người thích, bình luận hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.'
                : 'Không tìm thấy thông báo nào trong danh mục này.'}
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${
                !item.isRead
                  ? 'bg-surface-container border-primary/30 shadow-[0_0_12px_rgba(255,81,104,0.08)]'
                  : 'bg-surface-container/50 border-surface-container-highest/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Actor Avatar with event badge */}
                <div className="relative w-11 h-11 rounded-full shrink-0">
                  <img
                    src={
                      resolveMediaUrl(item.actor?.avatarUrl) ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt={item.actor?.username || 'user'}
                    className="w-full h-full rounded-full object-cover border border-surface-container-highest"
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-2 ring-surface ${
                      item.type === 'LIKE'
                        ? 'bg-primary'
                        : item.type === 'COMMENT'
                        ? 'bg-[#00f2fe]'
                        : item.type === 'MENTION'
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                  >
                    {item.type === 'LIKE' && <Heart size={10} className="fill-white" />}
                    {item.type === 'COMMENT' && <MessageCircle size={10} />}
                    {item.type === 'MENTION' && <AtSign size={10} />}
                    {item.type === 'FOLLOW' && <UserPlus size={10} />}
                  </div>
                </div>

                {/* Content description */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-on-surface leading-snug">
                    <span className="font-bold text-white mr-1">
                      {item.actor?.displayName || item.actor?.username}
                    </span>
                    <span className="text-on-surface-variant font-normal">
                      {item.type === 'LIKE' && 'đã thích video của bạn.'}
                      {item.type === 'COMMENT' &&
                        (item.comment?.content
                          ? `đã bình luận: "${item.comment.content.slice(0, 45)}${
                              item.comment.content.length > 45 ? '...' : ''
                            }"`
                          : 'đã bình luận vào video của bạn.')}
                      {item.type === 'MENTION' &&
                        (item.comment?.content
                          ? `đã nhắc đến bạn trong bình luận: "${item.comment.content.slice(0, 40)}${
                              item.comment.content.length > 40 ? '...' : ''
                            }"`
                          : 'đã nhắc đến bạn trong một bình luận.')}
                      {item.type === 'FOLLOW' && 'đã bắt đầu theo dõi bạn.'}
                    </span>
                  </p>
                  <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Video Thumbnail (if any) or Unread indicator */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {item.video?.thumbnailUrl ? (
                  <div className="w-10 h-12 rounded-lg overflow-hidden border border-surface-container-highest bg-black">
                    <img
                      src={resolveMediaUrl(item.video.thumbnailUrl)}
                      alt="video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <ChevronRight size={16} className="text-on-surface-variant/40" />
                )}

                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_6px_rgba(255,81,104,0.8)]" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
