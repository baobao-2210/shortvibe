import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoItem } from '../types/video';
import { videosApi, resolveMediaUrl } from '../services/api';

interface UseVideoFeedReturn {
  videos: VideoItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateVideoItem: (videoId: string, updates: Partial<VideoItem> | ((prev: VideoItem) => VideoItem)) => void;
}

export const useVideoFeed = (limit = 10): UseVideoFeedReturn => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Use a ref to track seen video IDs to prevent duplicate entries
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef<boolean>(false);

  const mapBackendItemToVideo = (item: any): VideoItem => {
    const authorObj = item.author || item.user;
    const authorId = authorObj?.id || item.userId;
    const authorUsername = authorObj?.username || 'creator';
    const authorDisplayName = authorObj?.displayName || authorObj?.fullName || authorUsername;
    const authorAvatar =
      resolveMediaUrl(authorObj?.avatarUrl) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    const views = item.viewCount ?? item.viewsCount ?? 0;

    return {
      id: item.id,
      userId: item.userId,
      caption: item.caption || '',
      videoUrl: resolveMediaUrl(item.videoUrl),
      thumbnailUrl:
        resolveMediaUrl(item.thumbnailUrl) ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      durationSeconds: item.durationSeconds || 15,
      visibility: item.visibility || 'PUBLIC',
      viewCount: views,
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      shareCount: Math.floor((views || 10) * 0.05),
      bookmarkCount: Math.floor((item.likeCount || 0) * 0.2),
      isLiked: item.isLiked || false,
      isBookmarked: false,
      soundTitle: `Âm thanh gốc - ${authorUsername}`,
      createdAt: item.createdAt || new Date().toISOString(),
      user: {
        id: authorId,
        username: authorUsername,
        displayName: authorDisplayName,
        avatarUrl: authorAvatar,
        isVerified: true,
        isFollowing: item.isFollowing || false,
      },
    };
  };

  const fetchFeed = useCallback(
    async (targetPage = 1, isInitial = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isInitial) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await videosApi.getFeed(targetPage, limit);
        const rawItems = response.data || [];
        const totalPages = response.meta?.totalPages || response.totalPages || 1;

        if (targetPage === 1) {
          seenIdsRef.current.clear();
        }

        const newVideos: VideoItem[] = [];
        for (const raw of rawItems) {
          if (!seenIdsRef.current.has(raw.id)) {
            seenIdsRef.current.add(raw.id);
            newVideos.push(mapBackendItemToVideo(raw));
          }
        }

        if (targetPage === 1) {
          setVideos(newVideos);
        } else {
          setVideos((prev) => [...prev, ...newVideos]);
        }

        setPage(targetPage);
        setHasMore(targetPage < totalPages && rawItems.length > 0);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch video feed:', err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore || isFetchingRef.current) {
      return;
    }
    await fetchFeed(page + 1, false);
  }, [hasMore, isLoading, isLoadingMore, page, fetchFeed]);

  const refresh = useCallback(async () => {
    await fetchFeed(1, true);
  }, [fetchFeed]);

  const updateVideoItem = useCallback(
    (videoId: string, updates: Partial<VideoItem> | ((prev: VideoItem) => VideoItem)) => {
      setVideos((prevVideos) =>
        prevVideos.map((v) => {
          if (v.id === videoId) {
            if (typeof updates === 'function') {
              return updates(v);
            }
            return {
              ...v,
              ...updates,
              user: updates.user ? { ...v.user, ...updates.user } : v.user,
            };
          }
          return v;
        })
      );
    },
    []
  );

  return {
    videos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    updateVideoItem,
  };
};
