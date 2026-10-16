import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, User, Mail, Sparkles, AlertCircle } from 'lucide-react';

export const MobileAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        if (!usernameOrEmail || !password) {
          setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
          setIsSubmitting(false);
          return;
        }
        await login(usernameOrEmail, password);
      } else {
        if (!email || !username || !password) {
          setError('Vui lòng điền email, tên đăng nhập và mật khẩu');
          setIsSubmitting(false);
          return;
        }
        await register({ email, username, password, displayName: displayName || username });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Đăng nhập/Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-surface-container rounded-t-3xl border-t border-surface-container-highest p-6 space-y-4 shadow-2xl safe-pb z-10 animate-slide-up">
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-[0_0_12px_rgba(254,44,85,0.5)]">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-on-surface">
              {authModalMode === 'login' ? 'Đăng nhập ShortVibe' : 'Tạo tài khoản mới'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {authModalMode === 'login' ? (
            <>
              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Tài khoản hoặc Email</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="ví dụ: alice_walker hoặc admin123"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Mật khẩu</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-on-surface-variant" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Quick Login Test Chips */}
              <div className="pt-1">
                <span className="text-[11px] text-on-surface-variant block mb-1.5 font-medium">
                  Chạm để đăng nhập nhanh tài khoản mẫu:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { u: 'alice_walker', p: 'password123', label: 'Alice' },
                    { u: 'admin123', p: 'Admin@123', label: 'Admin' },
                    { u: 'bob_builder', p: 'password123', label: 'Bob' },
                    { u: 'carol_danvers', p: 'password123', label: 'Carol' },
                  ].map((acc) => (
                    <button
                      key={acc.u}
                      type="button"
                      onClick={() => handleQuickLogin(acc.u, acc.p)}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-[11px] text-secondary-container font-medium border border-surface-container-highest/60 transition-colors"
                    >
                      @{acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Email</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-on-surface-variant" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Tên đăng nhập</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username_moi"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ví dụ: Vibe Creator"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Mật khẩu</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-on-surface-variant" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-sm text-on-surface border border-surface-container-highest/60 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-container to-primary text-white font-bold text-sm shadow-[0_0_16px_rgba(254,44,85,0.4)] hover:opacity-95 active:scale-98 transition-all flex items-center justify-center mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : authModalMode === 'login' ? (
              'Đăng nhập'
            ) : (
              'Đăng ký tài khoản'
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-on-surface-variant">
          {authModalMode === 'login' ? (
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-primary font-bold hover:underline"
              >
                Đăng ký ngay
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-primary font-bold hover:underline"
              >
                Đăng nhập
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
