import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Candidate endpoints for mobile devices
const DEFAULT_LAN_URL = 'http://192.168.1.2:3000';
const LOCALHOST_URL = 'http://localhost:3000';
const EMULATOR_URL = 'http://10.0.2.2:3000';

let currentApiBaseUrl = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const saved = localStorage.getItem('shortvibe_api_base');
  if (saved) return saved;
  if (Capacitor.isNativePlatform()) {
    // Default to localhost:3000 which works on real device via adb reverse, then auto-probes
    return LOCALHOST_URL;
  }
  return '/api';
})();

export const getApiBaseUrl = () => currentApiBaseUrl;

export const setApiBaseUrl = (url: string) => {
  currentApiBaseUrl = url;
  api.defaults.baseURL = url;
  localStorage.setItem('shortvibe_api_base', url);
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Auto-detect reachable endpoint when running on Native device (USB adb reverse, Wi-Fi LAN, or Emulator)
if (Capacitor.isNativePlatform()) {
  const testEndpoints = [
    LOCALHOST_URL,    // 1. Real phone with USB cable (adb reverse tcp:3000 tcp:3000)
    DEFAULT_LAN_URL,  // 2. Real phone or Emulator on Wi-Fi (192.168.1.2:3000)
    EMULATOR_URL,     // 3. Android Emulator internal loopback (10.0.2.2:3000)
  ];

  (async () => {
    for (const endpoint of testEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${endpoint}/videos?limit=1`, {
          signal: controller.signal,
          method: 'GET',
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          console.log('[ShortVibe API] Connected to endpoint:', endpoint);
          setApiBaseUrl(endpoint);
          break;
        }
      } catch {
        // try next endpoint
      }
    }
  })();
}

// Helper to resolve media URLs (thumbnails, videos) for Real Device vs Emulator vs Web
export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  const currentBase = getApiBaseUrl();

  if (Capacitor.isNativePlatform()) {
    // Replace localhost or 10.0.2.2 or LAN IP with the currently working base URL
    return url
      .replace('http://localhost:3000', currentBase)
      .replace('http://10.0.2.2:3000', currentBase)
      .replace('http://192.168.1.2:3000', currentBase);
  } else {
    // When running in browser preview
    return url
      .replace('http://10.0.2.2:3000', 'http://localhost:3000')
      .replace('http://192.168.1.2:3000', 'http://localhost:3000');
  }
};

// Auto-attach JWT token & dynamic baseURL
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('shortvibe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unauthorized handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config.url?.includes('/auth/login') && !error.config.url?.includes('/auth/register')) {
        localStorage.removeItem('shortvibe_token');
        localStorage.removeItem('shortvibe_user');
      }
    }
    return Promise.reject(error);
  }
);

/* =========================================================================
 * AUTH API
 * ========================================================================= */
export interface AuthResponse {
  message?: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    createdAt?: string;
  };
  accessToken: string;
}

export const authApi = {
  login: async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    return res.data;
  },

  register: async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

/* =========================================================================
 * VIDEOS API
 * ========================================================================= */
export interface VideoItem {
  id: string;
  caption?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  viewCount?: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isFollowing: boolean;
}

export interface PaginatedVideos {
  data: VideoItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const videosApi = {
  getFeed: async (
    page = 1,
    limit = 10,
    q?: string,
    sort?: 'newest' | 'oldest' | 'views' | 'likes'
  ): Promise<PaginatedVideos> => {
    const params: Record<string, any> = { page, limit };
    if (q && q.trim()) params.q = q.trim();
    if (sort) params.sort = sort;
    const res = await api.get('/videos', { params });
    return res.data;
  },

  getVideoById: async (id: string): Promise<VideoItem> => {
    const res = await api.get(`/videos/${id}`);
    return res.data;
  },

  createVideo: async (data: {
    caption?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    visibility?: 'PUBLIC' | 'PRIVATE';
  }): Promise<VideoItem> => {
    const res = await api.post('/videos', data);
    return res.data;
  },

  uploadFile: async (
    file: File | Blob,
    filename = 'shortvibe-video.mp4',
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });
    return res.data;
  },

  recordView: async (id: string): Promise<{ success: boolean; views: number }> => {
    const res = await api.post(`/videos/${id}/views`);
    return res.data;
  },

  getTrendingHashtags: async (): Promise<{ tag: string; count: number }[]> => {
    const res = await api.get('/videos/trending/hashtags');
    return res.data;
  },
};

/* =========================================================================
 * LIKES API
 * ========================================================================= */
export const likesApi = {
  likeVideo: async (videoId: string): Promise<{ success: boolean; isLiked: boolean; likeCount: number }> => {
    const res = await api.post(`/videos/${videoId}/likes`);
    return res.data;
  },

  unlikeVideo: async (videoId: string): Promise<{ success: boolean; isLiked: boolean; likeCount: number }> => {
    const res = await api.delete(`/videos/${videoId}/likes`);
    return res.data;
  },
};

/* =========================================================================
 * COMMENTS API
 * ========================================================================= */
export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  videoId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export const commentsApi = {
  getVideoComments: async (
    videoId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: CommentItem[]; meta?: { total: number; page: number; limit: number; totalPages: number } }> => {
    const res = await api.get(`/videos/${videoId}/comments`, { params: { page, limit } });
    return res.data;
  },

  addComment: async (videoId: string, content: string): Promise<CommentItem> => {
    const res = await api.post(`/videos/${videoId}/comments`, { content });
    return res.data;
  },

  deleteComment: async (commentId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },
};

/* =========================================================================
 * FOLLOWS API
 * ========================================================================= */
export const followsApi = {
  follow: async (userId: string): Promise<{ success: boolean; isFollowing: boolean }> => {
    const res = await api.post(`/users/${userId}/follow`);
    return res.data;
  },

  unfollow: async (userId: string): Promise<{ success: boolean; isFollowing: boolean }> => {
    const res = await api.delete(`/users/${userId}/follow`);
    return res.data;
  },

  getStatus: async (userId: string): Promise<{ isFollowing: boolean }> => {
    const res = await api.get(`/users/${userId}/follow-status`);
    return res.data;
  },
};

/* =========================================================================
 * USERS API
 * ========================================================================= */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
  totalLikes?: number;
  isFollowing?: boolean;
  _count?: {
    videos: number;
    followers: number;
    following: number;
  };
}

export const usersApi = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },

  getUserVideos: async (userId: string, page = 1, limit = 20): Promise<PaginatedVideos> => {
    const res = await api.get(`/users/${userId}/videos`, { params: { page, limit } });
    return res.data;
  },

  updateMe: async (data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<{ message: string; user: any }> => {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  search: async (
    q?: string,
    page = 1,
    limit = 10
  ): Promise<{ data: UserProfile[]; meta?: { total: number; page: number; limit: number; totalPages: number } }> => {
    const params: Record<string, any> = { page, limit };
    if (q && q.trim()) params.q = q.trim();
    const res = await api.get('/users/search', { params });
    return res.data;
  },
};

/* =========================================================================
 * NOTIFICATIONS API
 * ========================================================================= */
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  videoId?: string;
  commentId?: string;
  content?: string;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  video?: {
    id: string;
    caption?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
  };
  comment?: {
    id: string;
    content?: string;
  };
}

export const notificationsApi = {
  getNotifications: async (
    page = 1,
    limit = 20,
    type?: NotificationType,
  ): Promise<{
    data: NotificationItem[];
    meta: { total: number; page: number; limit: number; totalPages: number; unreadCount: number };
  }> => {
    const params: Record<string, any> = { page, limit };
    if (type) params.type = type;
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

