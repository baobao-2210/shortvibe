import React from 'react';
import { UserAuthor } from '../../types/video';

interface ActionSidebarProps {
  user: UserAuthor;
  likeCount: number;
  commentCount: number;
  bookmarkCount?: number;
  shareCount?: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  isFollowing?: boolean;
  onToggleLike: () => void;
  onToggleBookmark?: () => void;
  onToggleFollow?: () => void;
  onOpenComments?: () => void;
  onShare?: () => void;
  onPrevVideo?: () => void;
  onNextVideo?: () => void;
}

export const ActionSidebar: React.FC<ActionSidebarProps> = ({
  user,
  likeCount,
  commentCount,
  bookmarkCount = 0,
  shareCount = 0,
  isLiked,
  isBookmarked = false,
  isFollowing = false,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenComments,
  onShare,
  onPrevVideo,
  onNextVideo,
}) => {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-4 ml-3 sm:ml-4 z-30 select-none">
      {/* 1. Author Avatar & Follow Button */}
      <div className="relative flex flex-col items-center mb-1">
        <a
          href={`#@${user.username}`}
          className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#ff5168] via-[#fe2c55] to-[#00f2fe] shadow-[0_0_16px_rgba(255,81,104,0.4)] hover:scale-105 transition-transform flex items-center justify-center"
        >
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
            alt={user.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        </a>

        {!isFollowing && (
          <button
            type="button"
            onClick={onToggleFollow}
            title={`Theo dõi @${user.username}`}
            aria-label="Theo dõi tác giả"
            className="absolute -bottom-2 w-6 h-6 rounded-full bg-[#ff5168] hover:bg-[#fe2c55] text-white flex items-center justify-center shadow-[0_0_12px_rgba(255,81,104,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] font-bold leading-none">add</span>
          </button>
        )}
      </div>

      {/* 2. Like Button */}
      <div className="flex flex-col items-center gap-1 group">
        <button
          type="button"
          onClick={onToggleLike}
          aria-label={isLiked ? 'Bỏ thích video' : 'Thích video'}
          className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all cursor-pointer active:scale-75 ${
            isLiked
              ? 'bg-[#fe2c55]/20 text-[#fe2c55] shadow-[0_0_24px_rgba(254,44,85,0.6)] scale-105'
              : 'bg-[#2a2a2d]/80 hover:bg-[#353438] text-[#e4e1e6] hover:text-[#fe2c55] shadow-md group-hover:scale-110'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[26px] transition-transform duration-200 ${
              isLiked ? 'scale-110 text-[#fe2c55]' : ''
            }`}
            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
        <span
          className={`text-[12px] font-semibold tracking-wide font-['Space_Grotesk'] transition-colors ${
            isLiked ? 'text-[#fe2c55]' : 'text-[#e4e1e6] group-hover:text-[#fe2c55]'
          }`}
        >
          {formatCount(likeCount)}
        </span>
      </div>

      {/* 3. Comment Button */}
      <div className="flex flex-col items-center gap-1 group">
        <button
          type="button"
          onClick={onOpenComments}
          aria-label="Bình luận"
          className="w-12 h-12 rounded-full bg-[#2a2a2d]/80 hover:bg-[#353438] backdrop-blur-xl flex items-center justify-center text-[#e4e1e6] hover:text-[#00f2fe] shadow-md group-hover:scale-110 active:scale-90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
        </button>
        <span className="text-[12px] font-semibold tracking-wide font-['Space_Grotesk'] text-[#e4e1e6] group-hover:text-[#00f2fe] transition-colors">
          {formatCount(commentCount)}
        </span>
      </div>

      {/* 4. Bookmark Button */}
      <div className="flex flex-col items-center gap-1 group">
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-label="Lưu vào mục yêu thích"
          className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
            isBookmarked
              ? 'bg-[#b76dfd]/20 text-[#deb7ff] shadow-[0_0_20px_rgba(183,109,253,0.5)]'
              : 'bg-[#2a2a2d]/80 hover:bg-[#353438] text-[#e4e1e6] hover:text-[#deb7ff] shadow-md group-hover:scale-110'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
        <span className="text-[12px] font-semibold tracking-wide font-['Space_Grotesk'] text-[#e4e1e6] group-hover:text-[#deb7ff] transition-colors">
          {formatCount(bookmarkCount)}
        </span>
      </div>

      {/* 5. Share Button */}
      <div className="flex flex-col items-center gap-1 group">
        <button
          type="button"
          onClick={onShare}
          aria-label="Chia sẻ video"
          className="w-12 h-12 rounded-full bg-[#2a2a2d]/80 hover:bg-[#353438] backdrop-blur-xl flex items-center justify-center text-[#e4e1e6] hover:text-[#00f1fd] shadow-md group-hover:scale-110 active:scale-90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">share</span>
        </button>
        <span className="text-[12px] font-semibold tracking-wide font-['Space_Grotesk'] text-[#e4e1e6] group-hover:text-[#00f1fd] transition-colors">
          {formatCount(shareCount)}
        </span>
      </div>

      {/* 6. Rotating Vinyl Disc Animation */}
      <div className="pt-1 flex flex-col items-center">
        <div className="relative w-11 h-11 rounded-full p-1.5 bg-[#0e0e11]/90 shadow-xl flex items-center justify-center animate-[spin_5s_linear_infinite] hover:scale-110 transition-transform">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#39393c] to-[#353438] flex items-center justify-center overflow-hidden border border-[#5d3f40]/40">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt="Music Disc"
              className="w-6 h-6 rounded-full object-cover"
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff5168]/20 to-[#00f1fd]/20 pointer-events-none" />
        </div>
      </div>

      {/* 7. Next / Prev Navigation Arrows */}
      {(onPrevVideo || onNextVideo) && (
        <div className="flex flex-col gap-1.5 pt-2">
          {onPrevVideo && (
            <button
              type="button"
              onClick={onPrevVideo}
              aria-label="Video trước (Mũi tên lên)"
              title="Video trước"
              className="w-9 h-9 rounded-full bg-[#1b1b1e] hover:bg-[#2a2a2d] text-[#e4e1e6]/70 hover:text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
            </button>
          )}
          {onNextVideo && (
            <button
              type="button"
              onClick={onNextVideo}
              aria-label="Video tiếp theo (Mũi tên xuống)"
              title="Video tiếp theo"
              className="w-9 h-9 rounded-full bg-[#1b1b1e] hover:bg-[#2a2a2d] text-[#e4e1e6]/70 hover:text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
