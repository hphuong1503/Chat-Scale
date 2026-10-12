import React, { useState } from 'react';
import type { Room } from '../types.ts';

interface RoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRefresh: () => void;
  activeCategory?: string;
  onCreateRoomClick?: () => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  isLoading,
  error,
  page,
  hasPrevious,
  hasNext,
  onPrevPage,
  onNextPage,
  onRefresh,
  activeCategory = 'work',
  onCreateRoomClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Tab-based filtering
  const displayRooms = rooms.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'friends') {
      // Direct / 1-on-1 style rooms
      return r.name.toLowerCase().includes('direct') || r.name.toLowerCase().includes('alice') || r.name.toLowerCase().includes('bob');
    }
    if (activeCategory === 'archive') {
      return false; // No archived rooms by default
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'friends':
        return 'Direct Messages';
      case 'archive':
        return 'Archived Chats';
      case 'all':
        return 'All Conversations';
      default:
        return 'Workspaces';
    }
  };

  return (
    <aside
      aria-label="Rooms navigation"
      className="w-full md:w-[320px] flex-shrink-0 bg-[#f4f3fb] border-r border-[#e7e5f2] flex flex-col h-full select-none"
    >
      {/* Top Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-4 h-4 text-[#8a879e]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#eae8f7] text-sm text-[#1e1b29] placeholder-[#8a879e] rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#5e5ce6]/50 transition-all"
          />
        </div>
      </div>

      {/* Subheader with title, refresh, and add conversation button */}
      <div className="px-5 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-[#8a879e] uppercase tracking-wider">
          {getCategoryTitle()}
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded-xl text-[#8a879e] hover:text-[#5e5ce6] hover:bg-[#eae8f7] transition-colors disabled:opacity-50"
            title="Refresh conversations"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          {onCreateRoomClick && (
            <button
              type="button"
              onClick={onCreateRoomClick}
              className="w-6 h-6 rounded-xl bg-[#5e5ce6] hover:bg-[#4d4acb] text-white flex items-center justify-center shadow-sm shadow-[#5e5ce6]/30 transition-all"
              title="New conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mx-4 my-2 p-3 bg-[#fff0ee] text-[#ff5a43] text-xs rounded-2xl border border-[#ff5a43]/30"
        >
          {error}
        </div>
      )}

      {/* Rooms Scroll List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {isLoading && rooms.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8a879e]">
            Loading conversations...
          </div>
        ) : activeCategory === 'archive' ? (
          <div className="p-8 text-center text-xs text-[#8a879e]">
            <div className="w-12 h-12 rounded-2xl bg-[#eae8f7] flex items-center justify-center text-[#8a879e] mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <p className="font-semibold text-[#1e1b29]">No archived chats</p>
            <p className="mt-1">Conversations you archive will appear here.</p>
          </div>
        ) : displayRooms.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8a879e]">
            {searchQuery
              ? 'No matching conversations found.'
              : activeCategory === 'friends'
              ? 'No direct friends active yet. Click + to start a direct message.'
              : 'No conversations available.'}
          </div>
        ) : (
          displayRooms.map((room, idx) => {
            const isSelected = room.id === selectedRoomId;
            const initials = getInitials(room.name || 'Chat');

            // Visual badges
            const isPinned = idx === 0;
            const unreadCount = idx === 0 ? 1 : idx === 3 ? 3 : 0;
            const mockTime = idx === 0 ? '4m' : idx === 1 ? '20m' : idx === 2 ? '1h' : '1d';

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-all duration-150 ${
                  isSelected
                    ? 'bg-white shadow-sm shadow-indigo-900/5 border border-indigo-100/80'
                    : 'hover:bg-white/60'
                }`}
              >
                {/* Squircle Avatar */}
                <div
                  className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-sm text-white ${
                    idx % 3 === 0
                      ? 'bg-[#1e1d25]'
                      : idx % 3 === 1
                      ? 'bg-gradient-to-tr from-[#5e5ce6] to-[#7362e3]'
                      : 'bg-gradient-to-tr from-amber-500 to-rose-500'
                  }`}
                >
                  {initials}
                </div>

                {/* Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#1e1b29] truncate">
                      {room.name || 'Room'}
                    </h3>
                    <span className="text-[11px] font-medium text-[#8a879e] ml-1 flex-shrink-0">
                      {mockTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#8a879e] truncate max-w-[170px]">
                      {room.description || 'Active conversation stream'}
                    </p>

                    <div className="flex items-center space-x-1.5 ml-1 flex-shrink-0">
                      {isPinned && (
                        <svg
                          className="w-3.5 h-3.5 text-[#7362e3]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-label="Pinned"
                        >
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      )}
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#ff5a43] text-white text-[10px] font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {(hasPrevious || hasNext) && (
        <div className="p-3 bg-[#eae8f7]/60 border-t border-[#e7e5f2] flex items-center justify-between text-xs text-[#8a879e]">
          <button
            type="button"
            disabled={!hasPrevious}
            onClick={onPrevPage}
            className="px-2.5 py-1 rounded-xl bg-white text-[#1e1b29] font-medium disabled:opacity-40 disabled:bg-transparent shadow-sm"
          >
            Previous
          </button>
          <span className="font-semibold text-[11px]">Page {page}</span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNextPage}
            className="px-2.5 py-1 rounded-xl bg-white text-[#1e1b29] font-medium disabled:opacity-40 disabled:bg-transparent shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </aside>
  );
};
