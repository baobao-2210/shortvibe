import axios from 'axios';

// Vite proxy forwards /api -> http://localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to resolve media URLs (thumbnails, videos, avatars)
export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  // If video or media was stored with Android emulator IP 10.0.2.2:3000, resolve to localhost:3000
  if (url.includes('10.0.2.2:3000')) {
    return url.replace('10.0.2.2:3000', 'localhost:3000');
  }
  return url;
};

// Attach JWT access token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shortvibe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Only clear if not an auth attempt
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
    // Backend LoginDto expects { usernameOrEmail, password }
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    return res.data;
  },

  register: async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<AuthResponse> => {
    // Backend RegisterDto expects { email, username, password, displayName?, avatarUrl?, bio? }
    const payload = {
      email: data.email,
      username: data.username,
      password: data.password,
      displayName: data.displayName || data.fullName || undefined,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio || undefined,
    };
    const res = await api.post('/auth/register', payload);
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
  viewsCount?: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  author?: {
    id: string;
    username: string;
    fullName?: string;
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
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
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

  getTrendingHashtags: async (): Promise<{ tag: string; count: number }[]> => {
    const res = await api.get('/videos/trending/hashtags');
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
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
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

  updateVideo: async (
    id: string,
    data: { caption?: string; thumbnailUrl?: string; visibility?: 'PUBLIC' | 'PRIVATE' }
  ): Promise<{ message: string; video: VideoItem }> => {
    const res = await api.patch(`/videos/${id}`, data);
    return res.data;
  },

  deleteVideo: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/videos/${id}`);
    return res.data;
  },

  recordView: async (id: string): Promise<{ success: boolean; id: string; viewCount: number }> => {
    const res = await api.post(`/videos/${id}/views`);
    return res.data;
  },
};

/* =========================================================================
 * LIKES API
 * ========================================================================= */
export const likesApi = {
  like: async (videoId: string): Promise<{ success: boolean; likeCount: number; isLiked: boolean }> => {
    const res = await api.post(`/videos/${videoId}/likes`);
    return res.data;
  },

  unlike: async (videoId: string): Promise<{ success: boolean; likeCount: number; isLiked: boolean }> => {
    const res = await api.delete(`/videos/${videoId}/likes`);
    return res.data;
  },

  getStatus: async (videoId: string): Promise<{ isLiked: boolean; likeCount: number }> => {
    const res = await api.get(`/videos/${videoId}/likes`);
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
  parentId?: string | null;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  repliesCount?: number;
  replies?: CommentItem[];
}

export interface PaginatedComments {
  data: CommentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const commentsApi = {
  getByVideo: async (videoId: string, page = 1, limit = 20): Promise<PaginatedComments> => {
    const res = await api.get(`/videos/${videoId}/comments`, { params: { page, limit } });
    return res.data;
  },

  createComment: async (videoId: string, content: string, parentId?: string): Promise<CommentItem> => {
    const res = await api.post(`/videos/${videoId}/comments`, { content, parentId });
    return res.data;
  },

  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
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
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<{ message: string; user: any }> => {
    const payload = {
      displayName: data.displayName || data.fullName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
    };
    const res = await api.patch('/users/me', payload);
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

