import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi, followsApi, videosApi, UserProfile, VideoItem, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle,
  Play,
  Heart,
  Bookmark,
  Grid,
  Share2,
  Settings,
  UserPlus,
  UserCheck,
  Loader2,
  Lock,
  Camera,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
];

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, openAuthModal, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Edit Profile Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (!id) return;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const [profileData, videosData] = await Promise.all([
          usersApi.getProfile(id),
          usersApi.getUserVideos(id, 1, 50),
        ]);

        setProfile(profileData);
        setIsFollowing(profileData.isFollowing || false);
        setFollowerCount(profileData._count?.followers ?? profileData.followerCount ?? 0);
        setVideos(videosData.data || []);
      } catch (err: any) {
        console.warn('Failed to load profile from backend, using fallback demo:', err);
        setProfile({
          id: id,
          username: 'creator',
          displayName: 'Creator ShortVibe',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          bio: 'Chia sẻ cảm hứng sáng tạo, phong cách sống & công nghệ. Chúc bạn một ngày tràn đầy năng lượng! ⚡',
          createdAt: new Date().toISOString(),
          followerCount: 1420,
          followingCount: 38,
          totalLikes: 18600,
          isFollowing: false,
          _count: {
            videos: 0,
            followers: 1420,
            following: 38,
          },
        });
        setFollowerCount(1420);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!id) return;

    try {
      if (isFollowing) {
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
        await followsApi.unfollow(id);
      } else {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        await followsApi.follow(id);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Hồ sơ ${profile?.displayName || profile?.username} trên ShortVibe`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết trang cá nhân vào bộ nhớ tạm!');
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || profile.fullName || profile.username);
    setEditBio(profile.bio || '');
    setEditAvatarUrl(profile.avatarUrl || '');
    setAvatarPreview(profile.avatarUrl || '');
    setAvatarFile(null);
    setEditError(null);
    setIsEditOpen(true);
  };

  // Handle avatar file selection
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditError('Kích thước ảnh không được vượt quá 10 MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setEditError(null);
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) {
      setEditError('Tên hiển thị không được để trống.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      let finalAvatarUrl = editAvatarUrl.trim();

      // If user selected an image file from device, upload it first
      if (avatarFile) {
        const uploadRes = await videosApi.uploadFile(avatarFile);
        if (uploadRes?.url) {
          finalAvatarUrl = uploadRes.url;
        }
      }

      // Update on Backend via PATCH /users/me
      const updatedData = await usersApi.updateMe({
        displayName: editDisplayName.trim(),
        avatarUrl: finalAvatarUrl || undefined,
        bio: editBio.trim() || undefined,
      });

      const updatedUser = updatedData.user || {};

      // Update state locally
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: updatedUser.displayName || editDisplayName.trim(),
              avatarUrl: updatedUser.avatarUrl || finalAvatarUrl,
              bio: updatedUser.bio || editBio.trim(),
            }
          : prev
      );

      // Update AuthContext so Header and app components reflect the change
      updateUser({
        displayName: updatedUser.displayName || editDisplayName.trim(),
        avatarUrl: updatedUser.avatarUrl || finalAvatarUrl,
        bio: updatedUser.bio || editBio.trim(),
      });

      setIsEditOpen(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      console.error('Save profile error:', err);
      setEditError(err.response?.data?.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#fe2c55] animate-spin mb-3" />
        <span className="font-['Space_Grotesk'] text-sm text-[#e4e1e6]">Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <p className="text-white font-semibold mb-4">Không tìm thấy người dùng này</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-[#fe2c55] text-white font-medium text-sm"
        >
          Quay lại bảng tin
        </button>
      </div>
    );
  }

  const videoCount = profile._count?.videos ?? videos.length;
  const followingCount = profile._count?.following ?? profile.followingCount ?? 0;
  const totalLikes =
    profile.totalLikes ||
    videos.reduce((acc, v) => acc + (v.likeCount || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8 select-none">
      {/* =========================================================================
       * 1. CREATOR PROFILE HEADER CARD
       * ========================================================================= */}
      <div className="bg-[#18181c]/90 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
        {/* Avatar */}
        <div className="relative shrink-0 mx-auto md:mx-0">
          <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#fe2c55] via-[#ff5168] to-[#00f2fe] shadow-[0_0_24px_rgba(254,44,85,0.4)]">
            <img
              src={
                resolveMediaUrl(profile.avatarUrl) ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
              }
              alt={profile.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#00f2fe] text-black font-bold flex items-center justify-center text-xs shadow-md">
            ★
          </span>
        </div>

        {/* Identity & Stats */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="font-['Space_Grotesk'] font-black text-2xl lg:text-3xl text-white">
                  {profile.displayName || profile.fullName || profile.username}
                </h1>
                <CheckCircle size={20} className="text-[#00f2fe] fill-[#00f2fe]/20 shrink-0" />
              </div>
              <p className="font-['Space_Grotesk'] text-sm text-[#00f2fe] font-medium mt-0.5">
                @{profile.username}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white font-semibold text-sm border border-white/10 transition-all shadow-md active:scale-95"
                >
                  <Settings size={16} />
                  <span>Sửa hồ sơ</span>
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  type="button"
                  className={`flex items-center gap-1.5 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                    isFollowing
                      ? 'bg-[#2a2a2d] text-white border border-white/10'
                      : 'bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white shadow-[0_0_16px_rgba(254,44,85,0.4)] hover:shadow-[0_0_24px_rgba(254,44,85,0.6)]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={16} />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                className="p-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white/80 hover:text-white transition-colors"
                title="Chia sẻ hồ sơ"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center md:justify-start gap-6 pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg text-white font-['Space_Grotesk']">
                {formatNumber(videoCount)}
              </span>
              <span className="text-xs text-white/60 font-medium">Video</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg text-white font-['Space_Grotesk']">
                {formatNumber(followerCount)}
              </span>
              <span className="text-xs text-white/60 font-medium">Người theo dõi</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg text-white font-['Space_Grotesk']">
                {formatNumber(followingCount)}
              </span>
              <span className="text-xs text-white/60 font-medium">Đang theo dõi</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg text-[#fe2c55] font-['Space_Grotesk']">
                {formatNumber(totalLikes)}
              </span>
              <span className="text-xs text-white/60 font-medium">Lượt thích</span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-white/90 leading-relaxed max-w-2xl">
            {profile.bio || (
              <span className="text-white/40 italic">Chưa có mô tả tiểu sử.</span>
            )}
          </p>
        </div>
      </div>

      {/* =========================================================================
       * 2. TABS ROW
       * ========================================================================= */}
      <div className="flex border-b border-white/10 font-['Space_Grotesk']">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'videos'
              ? 'text-[#fe2c55] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#fe2c55]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Grid size={16} />
          <span>Video đã đăng ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'liked'
              ? 'text-[#fe2c55] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#fe2c55]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Heart size={16} />
          <span>Đã thích</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'saved'
              ? 'text-[#fe2c55] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#fe2c55]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Bookmark size={16} />
          <span>Đã lưu</span>
        </button>
      </div>

      {/* =========================================================================
       * 3. VIDEO GRID CARDS (9:16 Aspect)
       * ========================================================================= */}
      {videos.length === 0 ? (
        <div className="py-20 text-center text-white/50 font-['Space_Grotesk'] flex flex-col items-center gap-3">
          <Play size={40} className="mx-auto opacity-30 text-[#00f2fe]" />
          <p className="font-semibold text-base text-white">Chưa có video nào</p>
          <p className="text-xs text-white/50 max-w-sm">
            {isOwnProfile
              ? 'Bạn chưa xuất bản video nào. Hãy tạo video đầu tiên của bạn để chia sẻ với mọi người!'
              : 'Người dùng này chưa có video nào được công khai.'}
          </p>
          {isOwnProfile && (
            <Link
              to="/upload"
              className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white font-bold text-xs shadow-md hover:brightness-110 flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Tải lên video ngay</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((vid) => (
            <Link
              key={vid.id}
              to={`/video/${vid.id}`}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#18181c] group shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)] border border-white/5 hover:border-[#00f2fe]/40 transition-all cursor-pointer"
            >
              <img
                src={
                  resolveMediaUrl(vid.thumbnailUrl) ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'
                }
                alt={vid.caption || 'video thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Gradient bottom shadow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-80 group-hover:opacity-100 transition-opacity" />

              {/* Privacy badge if private */}
              {vid.visibility === 'PRIVATE' && (
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/90 flex items-center gap-1 border border-white/10">
                  <Lock size={10} className="text-[#fe2c55]" />
                  <span>Riêng tư</span>
                </div>
              )}

              {/* View Count at bottom left */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white font-['Space_Grotesk'] font-bold text-xs drop-shadow">
                <Play size={13} className="fill-white" />
                <span>{formatNumber(vid.viewCount || (vid as any).viewsCount || 0)}</span>
              </div>

              {/* Duration at bottom right */}
              {vid.durationSeconds && (
                <div className="absolute bottom-2.5 right-2.5 text-[10px] text-white/80 font-mono drop-shadow">
                  {vid.durationSeconds}s
                </div>
              )}

              {/* Center play icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform shadow-xl">
                  <Play size={24} className="fill-white ml-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* =========================================================================
       * 4. EDIT PROFILE MODAL
       * ========================================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#18181c] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-['Space_Grotesk'] font-bold text-base flex items-center gap-2">
                <Settings size={18} className="text-[#00f2fe]" />
                <span>Chỉnh sửa hồ sơ cá nhân</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 rounded-xl bg-[#ff5168]/20 border border-[#ff5168]/40 text-[#ff5168] text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              {/* Avatar Changer */}
              <div className="space-y-2">
                <label className="font-semibold text-white/80 font-['Space_Grotesk'] block">
                  Ảnh đại diện (Avatar)
                </label>
                <div className="flex items-center gap-4">
                  {/* Current / Preview Avatar */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-[#00f2fe] bg-[#121215]">
                    <img
                      src={
                        avatarPreview ||
                        editAvatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Upload button or link */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Camera size={14} className="text-[#00f2fe]" />
                        <span>Tải ảnh từ máy</span>
                      </button>
                      {avatarFile && (
                        <span className="text-[11px] text-[#00f2fe] truncate max-w-[150px]">
                          ✓ {avatarFile.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => {
                        setEditAvatarUrl(e.target.value);
                        setAvatarPreview(e.target.value);
                        setAvatarFile(null);
                      }}
                      placeholder="Hoặc dán URL ảnh đại diện..."
                      className="w-full bg-[#121215] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f2fe]"
                    />
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2">
                  <span className="text-[11px] text-white/50 block mb-1.5">Hoặc chọn ảnh có sẵn:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((av, idx) => (
                      <img
                        key={idx}
                        src={av}
                        alt={`preset ${idx}`}
                        onClick={() => {
                          setEditAvatarUrl(av);
                          setAvatarPreview(av);
                          setAvatarFile(null);
                        }}
                        className={`w-9 h-9 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ${
                          (avatarPreview || editAvatarUrl) === av
                            ? 'ring-2 ring-[#00f2fe]'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-white/80 font-['Space_Grotesk']">
                    Tên hiển thị
                  </label>
                  <span className="font-mono text-[11px] text-white/40">
                    {editDisplayName.length} / 100
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị của bạn..."
                  className="w-full bg-[#121215] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2fe]"
                />
              </div>

              {/* Bio Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-white/80 font-['Space_Grotesk']">
                    Mô tả tiểu sử (Bio)
                  </label>
                  <span className="font-mono text-[11px] text-white/40">
                    {editBio.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Giới thiệu bản thân, phong cách sáng tạo nội dung..."
                  className="w-full bg-[#121215] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00f2fe] resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 font-['Space_Grotesk']">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-xs font-semibold text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
