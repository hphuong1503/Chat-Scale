import React, { useState } from 'react';
import { api } from '../api/client.ts';
import { useAuthStore } from '../store/authStore.ts';

export const LoginView: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.login(username.trim(), password);
      setAuth(data.access, data.refresh, data.user);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Unable to log in with provided credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen topography-canvas flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Floating Messenger-style Glass Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/60 border border-white/20 p-8 sm:p-10 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5e5ce6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#7362e3]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5e5ce6] to-[#7362e3] flex items-center justify-center text-white shadow-xl shadow-indigo-900/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            {/* Neon Status Pip */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10b981] border-2 border-white rounded-full" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#1e1b29]">
            ChatApp Sign In
          </h1>
          <p className="mt-1 text-xs text-[#8a879e] max-w-xs">
            Connect to real-time team rooms with persistent messaging and notifications.
          </p>
        </div>

        {/* Quick Demo Fill Pills */}
        <div className="mt-6 pt-4 border-t border-[#f4f3fb]">
          <span className="block text-[11px] font-bold text-[#8a879e] uppercase tracking-wider text-center mb-2">
            Quick demo sign-in
          </span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('alice', 'password123')}
              className="px-3 py-1.5 rounded-xl bg-[#f4f3fb] hover:bg-[#eae8f7] text-xs font-semibold text-[#5e5ce6] transition-colors border border-indigo-100"
            >
              alice
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('bob', 'password123')}
              className="px-3 py-1.5 rounded-xl bg-[#f4f3fb] hover:bg-[#eae8f7] text-xs font-semibold text-[#5e5ce6] transition-colors border border-indigo-100"
            >
              bob
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="px-3 py-1.5 rounded-xl bg-[#f4f3fb] hover:bg-[#eae8f7] text-xs font-semibold text-[#7362e3] transition-colors border border-purple-100"
            >
              admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-2xl bg-[#fff0ee] p-3.5 border border-[#ff5a43]/30 text-xs text-[#ff5a43] font-medium flex items-center space-x-2.5 animate-fadeIn"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#f4f3fb] border border-transparent focus:border-[#5e5ce6] focus:bg-white rounded-2xl text-sm text-[#1e1b29] placeholder-[#8a879e] transition-all outline-none"
                placeholder="e.g. alice"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#f4f3fb] border border-transparent focus:border-[#5e5ce6] focus:bg-white rounded-2xl text-sm text-[#1e1b29] placeholder-[#8a879e] transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5e5ce6] hover:bg-[#4d4acb] active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-[#5e5ce6]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-[#8a879e]">
            ChatApp v0.2.0 • Secured with JWT Authentication
          </p>
        </div>
      </div>
    </div>
  );
};
