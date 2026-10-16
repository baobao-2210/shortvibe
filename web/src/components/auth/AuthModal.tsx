import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, AlertCircle, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const parseErrorMessage = (err: any, fallback: string): string => {
    const raw = err.response?.data?.message;
    if (Array.isArray(raw)) {
      return raw.join('. ');
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return fallback;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
    } catch (err: any) {
      setError(parseErrorMessage(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        password: regPassword,
        displayName: fullName.trim() || undefined,
      });
    } catch (err: any) {
      setError(parseErrorMessage(err, 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (identifier: string, pass: string = '123456') => {
    setError(null);
    setIsLoading(true);
    try {
      await login(identifier, pass);
    } catch (err: any) {
      setError(parseErrorMessage(err, 'Lỗi đăng nhập tài khoản mẫu'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-surface-container-low border border-surface-container-highest/60 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary-container flex items-center justify-center text-white font-black text-lg">
              S
            </span>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary via-primary-container to-secondary-container bg-clip-text text-transparent">
              ShortVibe
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {authModalMode === 'login' ? 'Đăng nhập vào ShortVibe' : 'Tạo tài khoản mới'}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {authModalMode === 'login'
              ? 'Khám phá video thịnh hành và tương tác cùng cộng đồng'
              : 'Đăng ký ngay để chia sẻ video ngắn của bạn'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-surface-container-highest/60 mb-6">
          <button
            onClick={() => { setError(null); openAuthModal('login'); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${
              authModalMode === 'login'
                ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setError(null); openAuthModal('register'); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${
              authModalMode === 'register'
                ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Email hoặc Tên người dùng
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="text"
                  required
                  placeholder="nhập email hoặc @username..."
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold hover:shadow-[0_0_20px_rgba(254,44,85,0.4)] disabled:opacity-50 transition-all text-sm"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Tên người dùng (username)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="text"
                  required
                  placeholder="vidu: linhdan_vibe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                placeholder="Linh Đan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Mật khẩu (ít nhất 6 ký tự)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-surface-container-highest/60 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary-container transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold hover:shadow-[0_0_20px_rgba(254,44,85,0.4)] disabled:opacity-50 transition-all text-sm"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
            </button>
          </form>
        )}

        {/* Quick Test Accounts from Seed Data */}
        <div className="mt-6 pt-4 border-t border-surface-container-highest/40">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
            <Sparkles size={14} className="text-secondary-container" />
            <span>Tài khoản thử nghiệm sẵn có:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice@shortvibe.app', '123456')}
              className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest/60 text-xs font-medium text-left truncate transition-colors"
            >
              👑 @alice_walker
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('diana@shortvibe.app', '123456')}
              className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest/60 text-xs font-medium text-left truncate transition-colors"
            >
              💻 @diana_dev
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
