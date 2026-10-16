import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  CheckCheck,
  Bell,
  X,
  Loader2,
} from 'lucide-react';
import {
  notificationsApi,
  NotificationItem,
  NotificationType,
  resolveMediaUrl,
} from '../../services/api';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | NotificationType>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const typeParam = filter === 'ALL' ? undefined : filter;
      const res = await notificationsApi.getNotifications(1, 30, typeParam);
      setNotifications(res.data || []);
      if (res.meta?.unreadCount !== undefined) {
        onUnreadCountChange?.(res.meta.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationsApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        onUnreadCountChange?.(Math.max(0, notifications.filter((n) => !n.isRead && n.id !== item.id).length));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    onClose();
    if (item.videoId) {
      navigate(`/video/${item.videoId}`);
    } else if (item.actorId) {
      navigate(`/profile/${item.actorId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAll(false);
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

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-96 bg-[#18181c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[540px] animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#121215]">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#00f2fe]" />
          <h3 className="font-bold text-sm text-white font-['Space_Grotesk']">Thông báo</h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-[11px] font-semibold text-[#00f2fe] hover:underline flex items-center gap-1 transition-all disabled:opacity-50"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck size={14} />
              <span>Đã đọc tất cả</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-2 bg-[#141418] border-b border-white/5 overflow-x-auto no-scrollbar text-xs">
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
            className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
              filter === tab.key
                ? 'bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
            <Loader2 size={24} className="animate-spin text-[#00f2fe]" />
            <span>Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center text-white/40 text-xs space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/30">
              <Bell size={22} />
            </div>
            <p className="font-semibold text-white/70">Chưa có thông báo nào</p>
            <p className="text-[11px] text-white/40 max-w-xs mx-auto">
              Khi ai đó thích, bình luận, nhắc tên hoặc theo dõi bạn, hoạt động sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item)}
              className={`p-3 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer relative ${
                !item.isRead ? 'bg-[#fe2c55]/5' : ''
              }`}
            >
              {/* Actor Avatar with event type badge */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2d] ring-1 ring-white/10">
                  {item.actor.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(item.actor.avatarUrl)}
                      alt={item.actor.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-primary to-secondary">
                      {(item.actor.displayName || item.actor.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white border border-[#18181c] ${
                    item.type === 'LIKE'
                      ? 'bg-[#fe2c55]'
                      : item.type === 'COMMENT'
                      ? 'bg-[#00f2fe] text-black'
                      : item.type === 'MENTION'
                      ? 'bg-amber-400 text-black'
                      : 'bg-emerald-500'
                  }`}
                >
                  {item.type === 'LIKE' ? (
                    <Heart size={9} className="fill-white" />
                  ) : item.type === 'COMMENT' ? (
                    <MessageCircle size={9} className="fill-black" />
                  ) : item.type === 'MENTION' ? (
                    <AtSign size={9} />
                  ) : (
                    <UserPlus size={9} />
                  )}
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-white leading-relaxed">
                  <span className="font-bold text-white hover:underline mr-1">
                    {item.actor.displayName || item.actor.username}
                  </span>
                  <span className="text-white/80 font-normal">
                    {item.type === 'LIKE' && 'đã thích video của bạn.'}
                    {item.type === 'COMMENT' && `đã bình luận: "${item.content || '...'}"`}
                    {item.type === 'MENTION' && `đã nhắc đến bạn trong một bình luận: "${item.content || '...'}"`}
                    {item.type === 'FOLLOW' && 'đã bắt đầu theo dõi bạn.'}
                  </span>
                </p>
                <span className="text-[10px] text-white/40 block mt-1">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>

              {/* Video Thumbnail if available */}
              {item.video?.thumbnailUrl && (
                <div className="w-10 h-13 rounded-lg overflow-hidden bg-black shrink-0 ring-1 ring-white/10">
                  <img
                    src={resolveMediaUrl(item.video.thumbnailUrl)}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Unread indicator */}
              {!item.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#00f2fe] shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
