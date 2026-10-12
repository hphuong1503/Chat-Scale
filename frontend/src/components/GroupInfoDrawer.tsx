import React from 'react';
import type { Room } from '../types.ts';

interface GroupInfoDrawerProps {
  room: Room;
  onClose?: () => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({ room, onClose }) => {
  const members = room.members || [
    { user: { id: 1, username: 'Tanisha Combs', email: 'tanisha@example.com' }, role: 'admin', joined_at: '' },
    { user: { id: 2, username: 'Alex Hunt', email: 'alex@example.com' }, role: 'member', joined_at: '' },
    { user: { id: 3, username: 'Jasmin Lowery', email: 'jasmin@example.com' }, role: 'member', joined_at: '' },
    { user: { id: 4, username: 'Max Padilla', email: 'max@example.com' }, role: 'member', joined_at: '' },
    { user: { id: 5, username: 'Jessie Rollins', email: 'jessie@example.com' }, role: 'member', joined_at: '' },
  ];

  return (
    <aside
      aria-label="Room details"
      className="w-full lg:w-[300px] flex-shrink-0 bg-[#f4f3fb] border-l border-[#e7e5f2] flex flex-col p-3 space-y-3 overflow-y-auto select-none"
    >
      {/* Top Card: Group Info */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="font-bold text-base text-[#1e1b29]">Group Info</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#8a879e] hover:text-[#1e1b29] p-1 rounded-lg"
              aria-label="Close group info"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Section: Files */}
        <div className="pt-3">
          <h3 className="text-xs font-bold text-[#8a879e] uppercase mb-2">Files</h3>

          <div className="space-y-3 text-sm">
            {/* 265 Photos with previews */}
            <div>
              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-indigo-600 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <svg className="w-4 h-4 text-[#8a879e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium text-xs text-[#1e1b29]">265 photos</span>
                </div>
                <svg className="w-3.5 h-3.5 text-[#8a879e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900 overflow-hidden relative shadow-inner">
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="h-16 rounded-2xl bg-gradient-to-tr from-amber-200 to-rose-300 overflow-hidden relative shadow-inner">
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              </div>
            </div>

            {/* Other Media Types */}
            {[
              { label: '13 videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
              { label: '378 files', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { label: '21 audio files', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
              { label: '45 shared links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
              { label: '2 589 voice messages', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
            ].map((media, mIdx) => (
              <div key={mIdx} className="flex items-center justify-between py-1 cursor-pointer hover:text-indigo-600 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <svg className="w-4 h-4 text-[#8a879e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={media.icon} />
                  </svg>
                  <span className="font-medium text-xs text-[#1e1b29]">{media.label}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-[#8a879e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Card: Members */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-base text-[#1e1b29]">{members.length} members</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="text-[#8a879e] hover:text-[#1e1b29] p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5 overflow-y-auto flex-1">
          {members.map((member, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {member.user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#1e1b29] truncate">
                  {member.user.username}
                </span>
              </div>

              {member.role === 'admin' ? (
                <span className="text-[11px] font-medium text-indigo-500">admin</span>
              ) : (
                <span className="text-[11px] font-medium text-[#8a879e]">member</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
