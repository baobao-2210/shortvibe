import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Camera,
  Film,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lock,
  Globe,
} from 'lucide-react';
import { videosApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MobileUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [duration, setDuration] = useState<number>(0);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Generate thumbnail from video frame
  const captureThumbnail = () => {
    const video = videoElementRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setThumbnailDataUrl(dataUrl);
      }
    } catch (err) {
      console.warn('Could not generate canvas thumbnail:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Video vượt quá dung lượng tối đa 100MB');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
  };

  const handleLoadedMetadata = () => {
    const video = videoElementRef.current;
    if (video) {
      setDuration(Math.round(video.duration));
      // Seek a bit in to capture a good thumbnail frame
      video.currentTime = Math.min(1.0, video.duration / 2);
    }
  };

  const handleReset = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setThumbnailDataUrl(null);
    setCaption('');
    setErrorMessage(null);
    setUploadPercent(0);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn hoặc quay một video ngắn');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadPercent(10);

    try {
      // 1. Upload video file to Backend
      const uploadRes = await videosApi.uploadFile(
        selectedFile,
        selectedFile.name,
        (percent) => setUploadPercent(Math.max(10, Math.min(85, percent)))
      );

      setUploadPercent(90);

      // 2. Upload thumbnail if generated
      let finalThumbnailUrl: string | undefined = undefined;
      if (thumbnailDataUrl) {
        try {
          const res = await fetch(thumbnailDataUrl);
          const blob = await res.blob();
          const thumbUpload = await videosApi.uploadFile(blob, 'thumb.jpg');
          finalThumbnailUrl = thumbUpload.url;
        } catch {
          // Fallback to video url or default
        }
      }

      // 3. Create video metadata in Database (normalize emulator host if present)
      const normalizeUrl = (url?: string) => (url ? url.replace('10.0.2.2:3000', 'localhost:3000') : url);

      await videosApi.createVideo({
        caption: caption.trim() || 'Video ngắn trên ShortVibe',
        videoUrl: normalizeUrl(uploadRes.url)!,
        thumbnailUrl: normalizeUrl(finalThumbnailUrl || uploadRes.url)!,
        durationSeconds: duration || 15,
        visibility,
      });

      setUploadPercent(100);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Publish failed:', err);
      setErrorMessage(err.response?.data?.message || 'Tải video lên thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-on-surface overflow-y-auto no-scrollbar pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-30 p-4 safe-pt bg-surface/90 backdrop-blur-md border-b border-surface-container-highest/60 flex items-center justify-between">
        <h1 className="text-base font-bold text-on-surface flex items-center gap-2">
          <Film size={18} className="text-primary" />
          <span>Đăng video ngắn</span>
        </h1>
        {selectedFile && (
          <button
            onClick={handleReset}
            className="text-xs text-on-surface-variant hover:text-white"
          >
            Hủy
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Hidden native inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-white">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-bounce">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-lg font-bold">Đăng video thành công!</h2>
            <p className="text-xs text-on-surface-variant">Đang chuyển về bảng tin ShortVibe...</p>
          </div>
        ) : !selectedFile ? (
          /* Selection / Camera options */
          <div className="space-y-4 pt-6">
            <div className="p-8 rounded-3xl bg-surface-container border-2 border-dashed border-surface-container-highest flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Tải lên video của bạn</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Định dạng MP4, QuickTime, WebM (tối đa 100MB)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest hover:bg-surface-container-highest active:scale-95 transition-all text-xs font-bold gap-2"
                >
                  <Film size={20} className="text-secondary" />
                  <span>Chọn từ thư viện</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest hover:bg-surface-container-highest active:scale-95 transition-all text-xs font-bold gap-2"
                >
                  <Camera size={20} className="text-primary" />
                  <span>Quay video mới</span>
                </button>
              </div>
            </div>

            {/* Upload guidelines */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest/40 space-y-2 text-xs text-on-surface-variant">
              <span className="font-bold text-on-surface block">Mẹo video thu hút nhiều tương tác:</span>
              <ul className="list-disc list-inside space-y-1">
                <li>Tỷ lệ khung hình dọc chuẩn 9:16.</li>
                <li>Thời lượng lý tưởng từ 15 đến 60 giây.</li>
                <li>Sử dụng các hashtag thịnh hành như #ShortVibe, #coffee, #dance.</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Preview and Metadata form */
          <form onSubmit={handlePublish} className="space-y-4">
            {/* 9:16 Video Preview */}
            <div className="relative aspect-[9/16] max-h-[380px] mx-auto rounded-2xl overflow-hidden bg-black border border-surface-container-highest/60 shadow-lg">
              <video
                ref={videoElementRef}
                src={videoPreviewUrl || ''}
                onLoadedMetadata={handleLoadedMetadata}
                onSeeked={captureThumbnail}
                controls
                playsInline
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={handleReset}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Caption & Hashtags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Mô tả video & Hashtags</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết caption cuốn hút kèm hashtag (#shortvibe, #travel)..."
                rows={3}
                className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant/70 border border-surface-container-highest focus:border-primary focus:outline-none transition-colors resize-none"
              />
              {/* Quick Hashtag helper chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['#shortvibe', '#trending', '#coffee', '#travel', '#dance'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCaption((prev) => `${prev} ${tag}`.trim())}
                    className="px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] text-secondary font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Quyền riêng tư</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    visibility === 'PUBLIC'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant border-surface-container-highest'
                  }`}
                >
                  <Globe size={14} />
                  <span>Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    visibility === 'PRIVATE'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant border-surface-container-highest'
                  }`}
                >
                  <Lock size={14} />
                  <span>Riêng tư</span>
                </button>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>Đang tải lên máy chủ...</span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    style={{ width: `${uploadPercent}%` }}
                    className="h-full bg-gradient-to-r from-primary-container to-primary transition-all duration-300 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-container to-primary text-white font-bold text-sm shadow-[0_0_16px_rgba(254,44,85,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý ({uploadPercent}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Đăng ngay</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
