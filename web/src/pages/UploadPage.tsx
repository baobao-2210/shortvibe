import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videosApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  Video as VideoIcon,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileVideo,
  X,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

const SUGGESTED_HASHTAGS = [
  '#ShortVibe',
  '#ViralVN',
  '#SangTaoKhongGioiHan',
  '#GocSetup',
  '#Trending',
  '#VlogSaigon',
  '#Edittok',
];

const PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
];

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  // Mode: 'file' (upload local file from device) vs 'url' (direct web link)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  // Selected file and object URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [directUrl, setDirectUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );

  // Video metadata
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [videoResolution, setVideoResolution] = useState<string>('1080x1920');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(PRESET_THUMBNAILS[0]);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);

  // Form states
  const [caption, setCaption] = useState<string>('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [allowComments, setAllowComments] = useState<boolean>(true);
  const [allowDuet, setAllowDuet] = useState<boolean>(true);

  // Upload progress & submission states
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Mini player controls
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local video selection (Mobile photo library or Desktop explorer)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processSelectedFile = (file: File) => {
    setError(null);

    // 1. Format validation
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp video (MP4, WebM, QuickTime MOV).');
      return;
    }

    // 2. Size validation (max 100MB)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 100) {
      setError(`Dung lượng video (${sizeInMB.toFixed(1)} MB) vượt quá giới hạn tối đa 100 MB.`);
      return;
    }

    setFileSizeStr(`${sizeInMB.toFixed(1)} MB`);
    setSelectedFile(file);

    // Create preview Object URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploadProgress(0);
  };

  // Auto-capture thumbnail and extract duration when video metadata is loaded
  const handleLoadedMetadata = () => {
    const video = previewVideoRef.current;
    if (!video) return;

    const dur = Math.round(video.duration);
    if (!isNaN(dur) && dur > 0) {
      setDurationSeconds(dur);
    }

    if (video.videoWidth && video.videoHeight) {
      setVideoResolution(`${video.videoWidth}x${video.videoHeight}`);
    }

    // Auto-capture thumbnail frame at 0.5s or 1s
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedThumbnail(dataUrl);
        setThumbnailUrl(dataUrl);
      }
    } catch (err) {
      console.warn('Canvas thumbnail capture notice:', err);
    }
  };

  // Manual recapture current frame as cover
  const handleCaptureCurrentFrame = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedThumbnail(dataUrl);
        setThumbnailUrl(dataUrl);
      }
    } catch (err) {
      console.error('Cannot capture frame:', err);
    }
  };

  // Quick hashtag insertion
  const insertTag = (tag: string) => {
    setCaption((prev) => (prev.includes(tag) ? prev : `${prev} ${tag}`.trim()));
  };

  // Toggle preview play
  const togglePlay = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      previewVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Submit flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      setError('Vui lòng chọn một tệp video từ thiết bị của bạn');
      return;
    }

    if (uploadMode === 'url' && !directUrl.trim()) {
      setError('Vui lòng nhập đường dẫn video hợp lệ');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = directUrl.trim();

      // Step 1: Upload video file to Backend storage if in file mode
      if (uploadMode === 'file' && selectedFile) {
        setUploadStep('Đang tải video lên máy chủ lưu trữ...');
        const uploadRes = await videosApi.uploadFile(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        if (!uploadRes?.url) {
          throw new Error('Máy chủ không trả về đường dẫn video hợp lệ');
        }
        finalVideoUrl = uploadRes.url;
      }

      // Step 2: Handle thumbnail (if base64 dataURI from canvas, upload it as an image file)
      let finalThumbnailUrl = thumbnailUrl.trim() || PRESET_THUMBNAILS[0];
      if (finalThumbnailUrl.startsWith('data:image/')) {
        try {
          const arr = finalThumbnailUrl.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const thumbFile = new File([u8arr], `thumb-${Date.now()}.jpg`, { type: mime });
          const thumbUploadRes = await videosApi.uploadFile(thumbFile);
          if (thumbUploadRes?.url) {
            finalThumbnailUrl = thumbUploadRes.url;
          }
        } catch (thumbErr) {
          console.warn('Thumbnail upload fallback:', thumbErr);
          finalThumbnailUrl = PRESET_THUMBNAILS[0];
        }
      }

      // Step 3: Save metadata to PostgreSQL via Backend
      setUploadStep('Đang lưu thông tin và xuất bản video vào hệ thống...');
      const created = await videosApi.createVideo({
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        caption: caption.trim() || undefined,
        durationSeconds: durationSeconds,
        visibility: visibility,
      });

      setSuccess(true);
      setUploadStep('Xuất bản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(`/video/${created.id}`);
      }, 1200);
    } catch (err: any) {
      console.error('Video publish failed:', err);
      const rawMsg = err.response?.data?.message || err.message;
      const formattedError = Array.isArray(rawMsg)
        ? rawMsg.join('. ')
        : typeof rawMsg === 'string'
        ? rawMsg
        : 'Không thể xuất bản video. Vui lòng kiểm tra lại thông tin và kết nối mạng.';
      setError(formattedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVideoSource = uploadMode === 'file' ? previewUrl : directUrl;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8 select-none">
      {/* Header Studio Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] font-black text-2xl lg:text-3xl text-white flex items-center gap-2.5">
            <Upload className="text-[#fe2c55]" />
            <span>ShortVibe Creator Studio</span>
          </h1>
          <p className="text-sm text-[#e6bcbd]/80 mt-1">
            Tải lên, xem trước và xuất bản video ngắn chuẩn 9:16 với âm thanh chất lượng cao.
          </p>
        </div>

        {/* Upload Mode Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-[#1e1e24] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-4 py-1.5 rounded-full text-xs font-['Space_Grotesk'] font-bold transition-all ${
              uploadMode === 'file'
                ? 'bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tải tệp từ thiết bị
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-4 py-1.5 rounded-full text-xs font-['Space_Grotesk'] font-bold transition-all ${
              uploadMode === 'url'
                ? 'bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Nhập URL trực tiếp
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-[#ff5168]/20 border border-[#ff5168]/40 text-[#ff5168] flex items-start gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-[#00f2fe]/20 border border-[#00f2fe]/40 text-[#00f2fe] flex items-start gap-3 text-sm animate-in fade-in">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <span>{uploadStep || 'Xuất bản video thành công! Đang chuyển hướng đến video...'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* =========================================================================
         * LEFT ZONE: PREVIEW & ASSET SELECTOR (lg:col-span-5)
         * ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* File Picker Dropzone (when in 'file' mode and no file yet) */}
          {uploadMode === 'file' && !selectedFile && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/14] rounded-3xl border-2 border-dashed border-[#fe2c55]/50 bg-[#16161a] hover:bg-[#1f1f26] hover:border-[#00f2fe] transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group shadow-xl"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-[#fe2c55]/20 text-[#fe2c55] group-hover:scale-110 group-hover:bg-[#00f2fe]/20 group-hover:text-[#00f2fe] flex items-center justify-center transition-all shadow-[0_0_20px_rgba(254,44,85,0.3)] mb-4">
                <FileVideo size={32} />
              </div>

              <h3 className="font-['Space_Grotesk'] font-bold text-base text-white mb-1">
                Chọn video để tải lên
              </h3>
              <p className="text-xs text-[#e6bcbd]/70 max-w-xs mb-4">
                Kéo thả video vào đây hoặc nhấn để duyệt từ điện thoại / máy tính
              </p>

              <div className="space-y-1 text-[11px] text-white/40">
                <p>• Định dạng: MP4, WebM, MOV</p>
                <p>• Dung lượng tối đa: 100 MB</p>
                <p>• Thời lượng tối đa: 3 phút</p>
              </div>

              <button
                type="button"
                className="mt-6 px-5 py-2 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white text-xs font-bold font-['Space_Grotesk'] shadow-md transition-colors"
              >
                Duyệt tệp tin
              </button>
            </div>
          )}

          {/* Live Mobile 9:16 Video HUD Preview (when file is selected or in URL mode) */}
          {(selectedFile || uploadMode === 'url') && (
            <div className="relative aspect-[9/16] w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-black border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col justify-between p-4 group">
              {/* Background Video Preview */}
              <video
                ref={previewVideoRef}
                src={activeVideoSource}
                poster={thumbnailUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Top Bar Preview Overlay */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-['Space_Grotesk'] font-bold text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fe2c55] animate-pulse" />
                  XEM TRƯỚC
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-['Space_Grotesk'] text-[#00f2fe] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                    {durationSeconds}s
                  </span>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                      title="Chọn video khác"
                      className="p-1 rounded-full bg-black/60 hover:bg-[#fe2c55] text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Center Play Button Overlay */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                    <Play size={28} className="fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Floating Right HUD Mock */}
              <div className="relative z-10 self-end flex flex-col items-center gap-2.5 opacity-90">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-[#fe2c55]">
                  ♥
                </div>
                <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs">
                  💬
                </div>
                <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs">
                  🔖
                </div>
              </div>

              {/* Bottom HUD Overlay */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">@{user?.username || 'creator'}</span>
                  <CheckCircle size={12} className="text-[#00f2fe]" />
                </div>
                <p className="text-[11px] text-white/90 line-clamp-2 leading-snug">
                  {caption || 'Nhập mô tả video để hiển thị xem trước...'}
                </p>
                {/* Mini scrubber bar */}
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-2">
                  <div className="w-2/3 h-full bg-gradient-to-r from-[#fe2c55] to-[#00f2fe]" />
                </div>
              </div>
            </div>
          )}

          {/* Video Metadata / Specifications Card */}
          <div className="bg-[#18181c] rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Định dạng & Thông số:</span>
              <span className="font-bold text-white">
                {videoResolution} • {durationSeconds}s {fileSizeStr && `• ${fileSizeStr}`}
              </span>
            </div>

            {uploadMode === 'url' ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                  Đường dẫn tệp Video trực tiếp (.mp4)
                </label>
                <input
                  type="url"
                  required
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://domain.com/video.mp4"
                  className="w-full h-9 px-3 rounded-xl bg-[#121215] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00f2fe] transition-all"
                />
              </div>
            ) : selectedFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121215] border border-white/5 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileVideo size={16} className="text-[#00f2fe] shrink-0" />
                  <span className="text-white truncate font-medium">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#00f2fe] hover:underline font-semibold shrink-0 ml-2"
                >
                  Đổi tệp
                </button>
              </div>
            ) : null}
          </div>

          {/* Thumbnail Selector & Frame Capture */}
          <div className="bg-[#18181c] rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider font-['Space_Grotesk']">
                Ảnh bìa (Thumbnail)
              </label>
              {(selectedFile || uploadMode === 'url') && (
                <button
                  type="button"
                  onClick={handleCaptureCurrentFrame}
                  className="text-[11px] text-[#00f2fe] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Camera size={13} />
                  <span>Chụp khung hình này</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {/* Captured Thumbnail from video */}
              {capturedThumbnail && (
                <div
                  onClick={() => setThumbnailUrl(capturedThumbnail)}
                  className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all ${
                    thumbnailUrl === capturedThumbnail
                      ? 'ring-2 ring-[#00f2fe] scale-105 shadow-[0_0_12px_rgba(0,242,254,0.5)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={capturedThumbnail} alt="Captured frame" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1 bg-black/70 rounded text-[9px] text-[#00f2fe] font-bold">
                    Khung hình
                  </span>
                </div>
              )}

              {/* Preset Thumbnails */}
              {PRESET_THUMBNAILS.map((thumb, idx) => (
                <div
                  key={idx}
                  onClick={() => setThumbnailUrl(thumb)}
                  className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all ${
                    thumbnailUrl === thumb
                      ? 'ring-2 ring-[#00f2fe] scale-105 shadow-[0_0_12px_rgba(0,242,254,0.5)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={thumb} alt="cover" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
         * RIGHT ZONE: METADATA & PUBLICATION FORM (lg:col-span-7)
         * ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#18181c] rounded-3xl p-6 lg:p-8 border border-white/10 shadow-xl space-y-6">
            {/* Caption Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-sm text-white font-['Space_Grotesk']">
                  Mô tả video & Hashtags
                </label>
                <span className="font-mono text-xs text-white/50">
                  {caption.length} / 2200
                </span>
              </div>
              <div className="bg-[#121215] rounded-2xl p-3 border border-white/10 focus-within:border-[#00f2fe] transition-all">
                <textarea
                  rows={4}
                  maxLength={2200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết chú thích cuốn hút, gắn hashtag để video tiếp cận nhiều người xem hơn..."
                  className="w-full bg-transparent border-0 outline-none resize-none text-sm text-white placeholder:text-white/30"
                />

                {/* Quick Tag Insert Tools */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-white/50 font-medium">Thịnh hành:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_HASHTAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTag(tag)}
                        className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 text-[#00f2fe] text-xs transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Selection */}
            <div className="space-y-2">
              <label className="font-semibold text-sm text-white block font-['Space_Grotesk']">
                Quyền riêng tư (Ai có thể xem video này)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer border transition-all ${
                    visibility === 'PUBLIC'
                      ? 'bg-[#1e1e24] border-[#00f2fe] shadow-[0_0_16px_rgba(0,242,254,0.2)]'
                      : 'bg-[#121215] border-white/5 hover:bg-[#1a1a20]'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'PUBLIC'}
                    onChange={() => setVisibility('PUBLIC')}
                    className="accent-[#00f2fe]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <Globe size={14} className="text-[#00f2fe]" />
                      <span>Công khai (Public)</span>
                    </span>
                    <span className="text-[11px] text-white/50 block mt-0.5">
                      Tất cả mọi người trên ShortVibe
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setVisibility('PRIVATE')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer border transition-all ${
                    visibility === 'PRIVATE'
                      ? 'bg-[#1e1e24] border-[#fe2c55] shadow-[0_0_16px_rgba(254,44,85,0.2)]'
                      : 'bg-[#121215] border-white/5 hover:bg-[#1a1a20]'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'PRIVATE'}
                    onChange={() => setVisibility('PRIVATE')}
                    className="accent-[#fe2c55]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <Lock size={14} className="text-[#fe2c55]" />
                      <span>Riêng tư (Private)</span>
                    </span>
                    <span className="text-[11px] text-white/50 block mt-0.5">
                      Chỉ mình bạn có thể xem
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Permissions Switches */}
            <div className="space-y-3">
              <label className="font-semibold text-sm text-white block font-['Space_Grotesk']">
                Cài đặt tương tác
              </label>
              <div className="bg-[#121215] rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Cho phép bình luận</span>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-4 h-4 accent-[#00f2fe] rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Cho phép tạo Duet & Ghép video</span>
                  <input
                    type="checkbox"
                    checked={allowDuet}
                    onChange={(e) => setAllowDuet(e.target.checked)}
                    className="w-4 h-4 accent-[#00f2fe] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Real Progress Bar during upload */}
            {isSubmitting && (
              <div className="space-y-2 p-4 rounded-2xl bg-[#121215] border border-white/10 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-['Space_Grotesk'] text-white font-semibold">
                    {uploadStep || 'Đang xử lý tải video...'}
                  </span>
                  <span className="font-mono text-[#00f2fe] font-bold">
                    {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#fe2c55] via-[#ff5168] to-[#00f2fe] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress > 0 ? uploadProgress : 45}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2.5 rounded-full bg-[#2a2a2d] hover:bg-[#353438] text-white text-sm font-semibold transition-colors font-['Space_Grotesk']"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (uploadMode === 'file' && !selectedFile)}
                className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff5168] text-white text-sm font-bold font-['Space_Grotesk'] shadow-[0_0_20px_rgba(254,44,85,0.4)] hover:shadow-[0_0_30px_rgba(254,44,85,0.7)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang xuất bản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Đăng ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
