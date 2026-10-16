import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Grid,
  Heart,
  Edit3,
  Eye,
  X,
  Share2,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  usersApi,
  followsApi,
  videosApi,
  UserProfile,
  VideoItem,
  resolveMediaUrl,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
];

export const MobileProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout, openAuthModal, refreshUser } = useAuth();

  const isMyProfile = !id || id === 'me' || id === currentUser?.id;
  const targetUserId = isMyProfile ? currentUser?.id : id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'likes'>('videos');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit Profile Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [profData, vidData] = await Promise.all([
          usersApi.getProfile(targetUserId),
          usersApi.getUserVideos(targetUserId, 1, 30),
        ]);

        if (isMounted) {
          setProfile(profData);
          setVideos(vidData.data || []);
          setEditDisplayName(profData.displayName || profData.username);
          setEditBio(profData.bio || '');

          if (!isMyProfile && isAuthenticated) {
            followsApi.getStatus(targetUserId).then((s) => setIsFollowing(s.isFollowing)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfileData();
    return () => {
      isMounted = false;
    };
  }, [targetUserId, isMyProfile, isAuthenticated]);

  const handleOpenEdit = () => {
    setEditDisplayName(profile?.displayName || profile?.username || '');
    setEditBio(profile?.bio || '');
    setEditAvatarUrl(profile?.avatarUrl || '');
    setAvatarPreview(profile?.avatarUrl ? resolveMediaUrl(profile.avatarUrl) : '');
    setAvatarFile(null);
    setEditError(null);
    setShowUrlInput(false);
    setIsEditOpen(true);
  };

  const handlePickPhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });

        if (image.webPath) {
          setAvatarPreview(image.webPath);
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setAvatarFile(file);
          setEditAvatarUrl('');
          setEditError(null);
        }
      } catch (err: any) {
        if (err?.message !== 'User cancelled photos app') {
          fileInputRef.current?.click();
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Vui lòng chỉ chọn tệp hình ảnh (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditError('Dung lượng ảnh tối đa là 10MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setEditAvatarUrl('');
    setEditError(null);
  };

  const handleSelectPreset = (url: string) => {
    setEditAvatarUrl(url);
    setAvatarPreview(url);
    setAvatarFile(null);
    setEditError(null);
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!targetUserId) return;

    try {
      if (isFollowing) {
        await followsApi.unfollow(targetUserId);
        setIsFollowing(false);
        setProfile((p) => p && { ...p, followerCount: Math.max(0, (p.followerCount || 0) - 1) });
      } else {
        await followsApi.follow(targetUserId);
        setIsFollowing(true);
        setProfile((p) => p && { ...p, followerCount: (p.followerCount || 0) + 1 });
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

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

      // If user selected an image file from device/camera, upload it first
      if (avatarFile) {
        const uploadRes = await videosApi.uploadFile(avatarFile, avatarFile.name || 'avatar.jpg');
        if (uploadRes?.url) {
          finalAvatarUrl = uploadRes.url;
        }
      }

      await usersApi.updateMe({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        avatarUrl: finalAvatarUrl || undefined,
      });

      await refreshUser();
      setProfile((p) =>
        p
          ? {
              ...p,
              displayName: editDisplayName.trim(),
              bio: editBio.trim(),
              avatarUrl: finalAvatarUrl || p.avatarUrl,
            }
          : p
      );
      setIsEditOpen(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setEditError(err.response?.data?.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated && isMyProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <User size={40} />
        </div>
        <h2 className="text-lg font-bold text-on-surface">Đăng nhập vào ShortVibe</h2>
        <p className="text-xs text-on-surface-variant max-w-xs">
          Quản lý trang cá nhân, video đã đăng, danh sách theo dõi và tương tác với nhà sáng tạo.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-full bg-primary text-white text-xs font-bold shadow-lg shadow-primary/30 active:scale-95"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-on-surface overflow-y-auto no-scrollbar pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-30 p-3.5 safe-pt bg-surface/90 backdrop-blur-md border-b border-surface-container-highest/60 flex items-center justify-between">
        <span className="text-sm font-bold text-on-surface truncate max-w-[200px]">
          @{profile?.username || currentUser?.username || 'user'}
        </span>
        <div className="flex items-center gap-2">
          {isMyProfile ? (
            <button
              onClick={logout}
              className="p-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-error transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ url: window.location.href }).catch(() => {});
                }
              }}
              className="p-1.5 rounded-full bg-surface-container text-on-surface-variant"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : profile ? (
        <div className="p-4 space-y-5">
          {/* Avatar and Info */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div
              onClick={isMyProfile ? handleOpenEdit : undefined}
              className={`relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary ${
                isMyProfile ? 'cursor-pointer active:scale-95 transition-transform' : ''
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-container">
                {profile.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(profile.avatarUrl)}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                    {(profile.displayName || profile.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
              {isMyProfile && (
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-background">
                  <Camera size={12} />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-on-surface">
                {profile.displayName || profile.username}
              </h2>
              <span className="text-xs text-on-surface-variant font-medium">@{profile.username}</span>
            </div>

            {profile.bio && (
              <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-around w-full max-w-xs py-2 border-y border-surface-container-highest/60 text-center">
              <div>
                <span className="block text-sm font-bold text-on-surface">
                  {profile._count?.following ?? profile.followingCount ?? 0}
                </span>
                <span className="text-[10px] text-on-surface-variant">Đang follow</span>
              </div>
              <div className="h-6 w-[1px] bg-surface-container-highest/60" />
              <div>
                <span className="block text-sm font-bold text-on-surface">
                  {profile._count?.followers ?? profile.followerCount ?? 0}
                </span>
                <span className="text-[10px] text-on-surface-variant">Follower</span>
              </div>
              <div className="h-6 w-[1px] bg-surface-container-highest/60" />
              <div>
                <span className="block text-sm font-bold text-on-surface">
                  {videos.reduce((acc, v) => acc + (v.likeCount || 0), 0)}
                </span>
                <span className="text-[10px] text-on-surface-variant">Thích</span>
              </div>
            </div>

            {/* Action Button: Edit Profile or Follow */}
            <div className="pt-1 w-full max-w-xs">
              {isMyProfile ? (
                <button
                  onClick={handleOpenEdit}
                  className="w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-colors border border-surface-container-highest active:scale-98"
                >
                  <Edit3 size={14} />
                  <span>Sửa hồ sơ</span>
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    isFollowing
                      ? 'bg-surface-container text-on-surface border border-surface-container-highest'
                      : 'bg-primary text-white shadow-sm shadow-primary/30'
                  }`}
                >
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              )}
            </div>
          </div>

          {/* Videos Tabs */}
          <div className="border-t border-surface-container-highest/60 pt-2">
            <div className="flex items-center justify-around pb-2">
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center gap-1.5 pb-1 text-xs font-bold transition-all ${
                  activeTab === 'videos'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <Grid size={15} />
                <span>Video ({videos.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex items-center gap-1.5 pb-1 text-xs font-bold transition-all ${
                  activeTab === 'likes'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <Heart size={15} />
                <span>Đã thích</span>
              </button>
            </div>

            {/* Video Grid */}
            {activeTab === 'videos' ? (
              videos.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  Chưa có video nào được đăng tải.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => navigate(`/video/${video.id}`)}
                      className="relative aspect-[9/16] bg-black overflow-hidden active:opacity-80 cursor-pointer"
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={resolveMediaUrl(video.thumbnailUrl)}
                          alt={video.caption}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={resolveMediaUrl(video.videoUrl)}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[10px] text-white font-semibold drop-shadow-md">
                        <Eye size={10} />
                        <span>{video.viewCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-12 text-center text-xs text-on-surface-variant">
                Danh sách video đã thích đang ở chế độ riêng tư.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Edit Profile Bottom Sheet */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container rounded-t-3xl border-t border-surface-container-highest p-5 space-y-4 safe-pb z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-highest/60">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Chỉnh sửa hồ sơ</h3>
                <p className="text-[11px] text-on-surface-variant">Cập nhật ảnh đại diện và thông tin cá nhân</p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Hidden File Input for Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector Section */}
              <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-highest/60 space-y-3">
                {/* Avatar Preview with Camera overlay badge */}
                <div
                  onClick={handlePickPhoto}
                  className="relative group cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/20">
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={resolveMediaUrl(avatarPreview)}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                          {(editDisplayName || profile?.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePickPhoto();
                    }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-surface-container active:scale-90 transition-transform"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera size={14} />
                  </button>
                </div>

                {/* Avatar Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="px-3.5 py-1.5 rounded-full bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors border border-primary/30"
                  >
                    <Upload size={13} />
                    <span>Tải ảnh từ máy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      showUrlInput
                        ? 'bg-secondary/20 text-secondary border-secondary/40'
                        : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest'
                    }`}
                  >
                    <LinkIcon size={13} />
                    <span>Dán URL</span>
                  </button>
                </div>

                {avatarFile && (
                  <div className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <Check size={12} />
                    <span className="truncate max-w-[200px]">Đã chọn: {avatarFile.name}</span>
                  </div>
                )}

                {/* Direct URL input if toggled */}
                {showUrlInput && (
                  <div className="w-full pt-1">
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => {
                        setEditAvatarUrl(e.target.value);
                        setAvatarPreview(e.target.value);
                        setAvatarFile(null);
                        setEditError(null);
                      }}
                      placeholder="Dán đường dẫn ảnh (https://...)"
                      className="w-full h-9 px-3 rounded-xl bg-surface-container-lowest text-xs text-on-surface border border-surface-container-highest focus:border-primary focus:outline-none placeholder:text-on-surface-variant/50"
                    />
                  </div>
                )}

                {/* Preset Avatars Carousel */}
                <div className="w-full pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                      <Sparkles size={11} className="text-primary" />
                      Hoặc chọn ảnh đại diện mẫu:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                    {PRESET_AVATARS.map((presetUrl, idx) => {
                      const isSelected = (avatarPreview === presetUrl || editAvatarUrl === presetUrl) && !avatarFile;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(presetUrl)}
                          className={`relative shrink-0 w-10 h-10 rounded-full overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container scale-105'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <img
                            src={presetUrl}
                            alt={`Preset ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center text-white">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  maxLength={50}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest text-xs text-on-surface border border-surface-container-highest focus:border-primary focus:outline-none placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Tiểu sử (Bio)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Giới thiệu bản thân..."
                  rows={3}
                  maxLength={200}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest text-xs text-on-surface border border-surface-container-highest focus:border-primary focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
                <div className="flex justify-end pr-1 text-[10px] text-on-surface-variant/70">
                  {editBio.length}/200
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{avatarFile ? 'Đang tải ảnh & lưu...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
