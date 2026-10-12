import React from 'react';
import { useAuthStore } from '../store/authStore.ts';

interface NavigationRailProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab = 'work',
  onTabChange,
  onOpenProfile,
  onOpenSettings,
}) => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    {
      id: 'all',
      label: 'All chats',
      badge: 43,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      id: 'work',
      label: 'Work',
      badge: 4,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'friends',
      label: 'Friends',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: 'news',
      label: 'News',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Application navigation"
      className="w-[76px] flex-shrink-0 bg-[#1e1d25] flex flex-col items-center py-5 justify-between select-none z-20"
    >
      {/* Top Logo */}
      <div className="flex flex-col items-center space-y-6">
        <div
          onClick={() => onTabChange?.('all')}
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="ChatApp Home"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
          </svg>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col items-center space-y-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange?.(item.id)}
                className={`relative group flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#33323c] text-white shadow-sm'
                    : 'text-[#848096] hover:text-gray-200 hover:bg-[#282732]'
                }`}
                title={item.label}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ff5a43] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#1e1d25]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium tracking-tight text-center truncate max-w-[54px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center space-y-3 pt-4 border-t border-[#2e2d38] w-full">
        {/* Profile Modal Trigger */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl text-[#848096] hover:text-white hover:bg-[#282732] transition-colors"
          title={`Signed in as ${user?.username || 'User'}`}
        >
          <div className="w-7 h-7 rounded-xl bg-purple-900/50 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-700/50">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>

        {/* Preferences Modal Trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl text-[#848096] hover:text-white hover:bg-[#282732] transition-colors"
          title="Preferences & Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl text-[#848096] hover:text-red-400 hover:bg-[#282732] transition-colors"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-[10px] mt-0.5">Log out</span>
        </button>
      </div>
    </nav>
  );
};
