import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [status, setStatus] = useState<'online' | 'busy' | 'away'>('online');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8a879e] hover:text-[#1e1b29] p-1.5 rounded-xl hover:bg-[#f4f3fb] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#5e5ce6] to-[#7362e3] flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-900/25">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${
                status === 'online'
                  ? 'bg-[#10b981]'
                  : status === 'busy'
                  ? 'bg-[#ff5a43]'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          <h2 className="mt-4 text-xl font-bold text-[#1e1b29]">
            {user?.username || 'Authenticated User'}
          </h2>
          <span className="text-xs text-[#8a879e] mt-0.5">
            User ID: #{user?.id || '—'} • {user?.username === 'admin' ? 'Administrator' : 'Team Member'}
          </span>
        </div>

        {/* Status Selector */}
        <div className="mt-6 bg-[#f4f3fb] p-1.5 rounded-2xl flex items-center justify-between text-xs font-semibold">
          {(['online', 'busy', 'away'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 py-1.5 rounded-xl capitalize transition-all ${
                status === s
                  ? 'bg-white text-[#1e1b29] shadow-sm'
                  : 'text-[#8a879e] hover:text-[#1e1b29]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Details Card */}
        <div className="mt-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3fb]/60">
            <span className="text-[#8a879e] font-medium">Session Status</span>
            <span className="font-semibold text-emerald-600 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
              Active (JWT)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3fb]/60">
            <span className="text-[#8a879e] font-medium">Role Privilege</span>
            <span className="font-semibold text-[#5e5ce6]">
              {user?.username === 'admin' ? 'Workspace Admin' : 'Active Contributor'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#fff0ee] hover:bg-[#ffe5e1] text-[#ff5a43] text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out of ChatApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
