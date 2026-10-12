import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from './store/authStore.ts';
import { api } from './api/client.ts';
import type { Room, MessageItem } from './types.ts';
import { LoginView } from './components/LoginView.tsx';
import { NavigationRail } from './components/NavigationRail.tsx';
import { RoomList } from './components/RoomList.tsx';
import { ChatView } from './components/ChatView.tsx';
import { GroupInfoDrawer } from './components/GroupInfoDrawer.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CreateRoomModal } from './components/CreateRoomModal.tsx';
import { NewsFeedView } from './components/NewsFeedView.tsx';
import { useChatWebSocket } from './hooks/useChatWebSocket.ts';
import { mergeMessages } from './utils/messageHelpers.ts';

export const App: React.FC = () => {
  const { isAuthenticated, accessToken } = useAuthStore();

  // Navigation tab state
  const [activeNavTab, setActiveNavTab] = useState('work');

  // Modal dialog states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsPage, setRoomsPage] = useState(1);
  const [roomsHasNext, setRoomsHasNext] = useState(false);
  const [roomsHasPrev, setRoomsHasPrev] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // Selected room state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Stale request tracking
  const activeRoomIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch Rooms
  const fetchRooms = useCallback(
    async (pageToLoad = 1) => {
      if (!isAuthenticated) return;
      setIsLoadingRooms(true);
      setRoomsError(null);

      try {
        const data = await api.getRooms(pageToLoad);
        const list = data.results || [];
        setRooms(list);
        setRoomsHasNext(Boolean(data.next));
        setRoomsHasPrev(Boolean(data.previous));
        setRoomsPage(pageToLoad);

        // Auto-select first room on desktop if none selected
        if (!selectedRoomId && list.length > 0 && window.innerWidth >= 768) {
          setSelectedRoomId(list[0].id);
          fetchRoomMessages(list[0].id);
        }
      } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: { detail?: string } } };
        if (error.response?.status !== 401) {
          setRoomsError(error.response?.data?.detail || 'Failed to load rooms.');
        }
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [isAuthenticated, selectedRoomId]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms(1);
    } else {
      setRooms([]);
      setSelectedRoomId(null);
      setMessages([]);
    }
  }, [isAuthenticated, fetchRooms]);

  // Fetch initial messages for selected room
  const fetchRoomMessages = useCallback(
    async (roomId: string) => {
      if (!isAuthenticated) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      activeRoomIdRef.current = roomId;

      setIsLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);
      setMessagesPage(1);
      setHasOlderMessages(false);

      try {
        const data = await api.getRoomMessages(roomId, 1, controller.signal);
        if (activeRoomIdRef.current === roomId) {
          setMessages(mergeMessages([], data.results || []));
          setHasOlderMessages(Boolean(data.next));
          setMessagesPage(1);
        }
      } catch (err: unknown) {
        const error = err as { name?: string; response?: { status?: number; data?: { detail?: string } } };
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return;
        }
        if (activeRoomIdRef.current === roomId) {
          if (error.response?.status === 404) {
            setMessagesError('Room not found or you are not a member of this room.');
          } else if (error.response?.status !== 401) {
            setMessagesError(error.response?.data?.detail || 'Failed to load messages.');
          }
        }
      } finally {
        if (activeRoomIdRef.current === roomId) {
          setIsLoadingMessages(false);
        }
      }
    },
    [isAuthenticated]
  );

  // Load older messages (page + 1)
  const handleLoadOlder = useCallback(async () => {
    if (!selectedRoomId || isLoadingOlder || !hasOlderMessages) return;

    setIsLoadingOlder(true);
    const nextPage = messagesPage + 1;

    try {
      const data = await api.getRoomMessages(selectedRoomId, nextPage);
      if (activeRoomIdRef.current === selectedRoomId) {
        setMessages((prev) => mergeMessages(prev, data.results || []));
        setHasOlderMessages(Boolean(data.next));
        setMessagesPage(nextPage);
      }
    } catch {
      // Failed to load older page
    } finally {
      setIsLoadingOlder(false);
    }
  }, [selectedRoomId, isLoadingOlder, hasOlderMessages, messagesPage]);

  // Refetch latest messages on WebSocket event
  const handleRefreshLatest = useCallback(async () => {
    if (!selectedRoomId) return;
    try {
      const data = await api.getRoomMessages(selectedRoomId, 1);
      if (activeRoomIdRef.current === selectedRoomId) {
        setMessages((prev) => mergeMessages(prev, data.results || []));
      }
    } catch {
      // Ignore background refetch error
    }
  }, [selectedRoomId]);

  // WebSocket hook
  const { status: wsStatus, reconnect: reconnectWS } = useChatWebSocket({
    roomId: selectedRoomId,
    accessToken,
    onNewMessageEvent: handleRefreshLatest,
  });

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchRoomMessages(roomId);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedRoomId) {
      return { success: false, error: 'No room selected' };
    }

    try {
      const response = await api.sendMessage(selectedRoomId, text);
      if (response.status === 202) {
        await handleRefreshLatest();
        return { success: true, notice: 'Queued' };
      }
      return { success: true };
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string[]; detail?: string } };
      };
      if (error.response?.status === 401) {
        return { success: false, error: 'Session expired. Please sign in again.' };
      }
      if (error.response?.status === 404) {
        return { success: false, error: 'Cannot send message: You are not an active member of this room.' };
      }
      if (error.response?.data?.message) {
        return { success: false, error: error.response.data.message[0] };
      }
      return {
        success: false,
        error: 'Send status unknown—check history before resending.',
      };
    }
  };

  const handleCreateRoom = async (name: string, description: string, isDirect: boolean) => {
    const newRoom = await api.createRoom(name, description, isDirect ? 'DIRECT' : 'GROUP');
    await fetchRooms(1);
    setSelectedRoomId(newRoom.id);
    fetchRoomMessages(newRoom.id);
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="w-screen h-screen topography-canvas p-2 sm:p-4 md:p-6 flex items-center justify-center overflow-hidden">
      {/* Floating Main Messenger Container */}
      <div className="w-full h-full max-w-[1600px] bg-white rounded-3xl shadow-2xl shadow-black/60 border border-white/10 flex overflow-hidden relative">
        {/* Far Left Navigation Rail (Dark dock) */}
        <div className="hidden md:flex">
          <NavigationRail
            activeTab={activeNavTab}
            onTabChange={(tab) => {
              setActiveNavTab(tab);
              if (tab !== 'news' && !selectedRoomId && rooms.length > 0) {
                setSelectedRoomId(rooms[0].id);
                fetchRoomMessages(rooms[0].id);
              }
            }}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        {/* Room List Sidebar */}
        {activeNavTab !== 'news' && (
          <div
            className={`${
              selectedRoomId ? 'hidden md:flex' : 'flex'
            } w-full md:w-[320px] h-full flex-shrink-0`}
          >
            <RoomList
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              isLoading={isLoadingRooms}
              error={roomsError}
              page={roomsPage}
              hasPrevious={roomsHasPrev}
              hasNext={roomsHasNext}
              onPrevPage={() => fetchRooms(roomsPage - 1)}
              onNextPage={() => fetchRooms(roomsPage + 1)}
              onRefresh={() => fetchRooms(roomsPage)}
              activeCategory={activeNavTab}
              onCreateRoomClick={() => setIsCreateRoomOpen(true)}
            />
          </div>
        )}

        {/* Center View: News Feed OR Conversation Stream */}
        {activeNavTab === 'news' ? (
          <div className="flex-1 h-full min-w-0">
            <NewsFeedView />
          </div>
        ) : (
          <div
            className={`${
              selectedRoomId ? 'flex' : 'hidden md:flex'
            } flex-1 h-full min-w-0`}
          >
            {activeRoom ? (
              <ChatView
                room={activeRoom}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                messagesError={messagesError}
                wsStatus={wsStatus}
                onReconnectWS={reconnectWS}
                onLoadOlder={handleLoadOlder}
                hasOlderMessages={hasOlderMessages}
                isLoadingOlder={isLoadingOlder}
                onSendMessage={handleSendMessage}
                onBackToRooms={() => setSelectedRoomId(null)}
                onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
                isInfoOpen={isInfoOpen}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-3xl bg-[#f4f3fb] flex items-center justify-center text-[#5e5ce6] shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5e5ce6] text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow">
                    +
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#1e1b29]">Select a conversation</h2>
                <p className="text-xs text-[#8a879e] mt-1.5 max-w-sm">
                  Choose a workspace channel from the sidebar or start a new conversation.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="mt-5 px-5 py-2.5 rounded-2xl bg-[#5e5ce6] hover:bg-[#4d4acb] text-white text-xs font-semibold shadow-md shadow-[#5e5ce6]/25 transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Conversation</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right Info Drawer (Group Info & Members) */}
        {activeNavTab !== 'news' && isInfoOpen && activeRoom && (
          <div className="hidden lg:flex h-full">
            <GroupInfoDrawer room={activeRoom} onClose={() => setIsInfoOpen(false)} />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
};
