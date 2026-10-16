export interface UserAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
}

export interface VideoItem {
  id: string;
  userId: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  bookmarkCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  soundTitle?: string;
  createdAt: string;
  user: UserAuthor;
}
