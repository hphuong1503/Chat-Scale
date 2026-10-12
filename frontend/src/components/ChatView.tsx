import React, { useState, useEffect, useRef } from 'react';
import type { Room, MessageItem, WSConnectionStatus } from '../types.ts';
import { useAuthStore } from '../store/authStore.ts';

interface ChatViewProps {
  room: Room;
  messages: MessageItem[];
  isLoadingMessages: boolean;
  messagesError: string | null;
  wsStatus: WSConnectionStatus;
  onReconnectWS: () => void;
  onLoadOlder: () => void;
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  onSendMessage: (text: string) => Promise<{ success: boolean; error?: string; notice?: string }>;
  onBackToRooms?: () => void;
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  room,
  messages,
  isLoadingMessages,
  messagesError,
  wsStatus,
  onReconnectWS,
  onLoadOlder,
  hasOlderMessages,
  isLoadingOlder,
  onSendMessage,
  onBackToRooms,
  onToggleInfo,
  isInfoOpen,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [room.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    const byteLength = new TextEncoder().encode(trimmed).length;
    if (byteLength > 10 * 1024) {
      setSendError('Message exceeds maximum limit of 10 KB.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setInputText('');
    inputRef.current?.focus();

    try {
      const result = await onSendMessage(trimmed);
      if (result.success) {
        if (result.notice) {
          setSendNotice(result.notice);
          setTimeout(() => setSendNotice(null), 2500);
        }
      } else {
        setSendError(result.error || 'Failed to send message.');
      }
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <main
      aria-label="Conversation"
      className="flex-1 flex flex-col h-full bg-white relative overflow-hidden select-none"
    >
      {/* Header matching screenshot */}
      <div className="px-6 py-4 border-b border-[#e7e5f2] flex items-center justify-between bg-white z-10">
        <div className="flex items-center space-x-3 min-w-0">
          {onBackToRooms && (
            <button
              type="button"
              onClick={onBackToRooms}
              className="md:hidden p-1.5 -ml-2 text-[#8a879e] hover:text-[#1e1b29] rounded-xl hover:bg-gray-100"
              aria-label="Back to rooms list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div>
            <h1 className="text-xl font-bold text-[#1e1b29] tracking-tight truncate">
              {room.name || 'Chat'}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-[#8a879e]">
              <span>{room.members?.length ? `${room.members.length} members` : 'Active conversation'}</span>
              <span>•</span>
              {/* WS Live status badge */}
              {wsStatus === 'connected' && (
                <span className="inline-flex items-center text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
              {wsStatus === 'connecting' && (
                <span className="inline-flex items-center text-amber-500">
                  <span className="w-1.5 h-1.5 mr-1 bg-amber-400 rounded-full animate-ping" />
                  Connecting...
                </span>
              )}
              {(wsStatus === 'disconnected' || wsStatus === 'error') && (
                <span className="inline-flex items-center text-rose-500">
                  <span className="w-1.5 h-1.5 mr-1 bg-rose-500 rounded-full" />
                  Offline
                  <button
                    type="button"
                    onClick={onReconnectWS}
                    className="ml-1 underline text-indigo-600 font-bold"
                  >
                    Reconnect
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Action Icons */}
        <div className="flex items-center space-x-3 text-[#8a879e]">
          <button type="button" className="p-2 hover:text-[#1e1b29] hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button type="button" className="p-2 hover:text-[#1e1b29] hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggleInfo}
            className={`p-2 rounded-xl transition-colors ${
              isInfoOpen ? 'text-indigo-600 bg-indigo-50' : 'hover:text-[#1e1b29] hover:bg-gray-100'
            }`}
            title="Toggle Group Info"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-white select-text"
      >
        {/* Load older messages button */}
        {hasOlderMessages && (
          <div className="text-center pb-2">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className="px-4 py-1.5 bg-[#f4f3fb] border border-[#e7e5f2] text-xs font-semibold rounded-full text-[#5e5ce6] hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              {isLoadingOlder ? 'Loading older...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messagesError && (
          <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
            {messagesError}
          </div>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8a879e]">
            <div className="w-16 h-16 rounded-3xl bg-[#f4f3fb] flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#1e1b29]">Welcome to {room.name}!</p>
            <p className="text-xs text-[#8a879e] mt-1">Send a message to start the conversation.</p>
          </div>
        )}

        {/* Message Bubble Rows */}
        {messages.map((item) => {
          // Identify outgoing vs incoming based on authenticated current user
          const isOutgoing = Boolean(
            (currentUser && item.sender && (item.sender.id === currentUser.id || item.sender.username === currentUser.username)) ||
            (currentUser && item.sender_id && String(item.sender_id) === String(currentUser.id)) ||
            item.status === 'queued'
          );

          const senderName = isOutgoing
            ? (currentUser?.username || 'You')
            : (item.sender?.username || 'Member');

          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div
              key={item.id}
              className={`flex items-end space-x-2.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
            >
              {/* Incoming Avatar on Left */}
              {!isOutgoing && (
                <div
                  className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  title={senderName}
                >
                  {getInitials(senderName)}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className={`flex flex-col max-w-md ${isOutgoing ? 'items-end' : 'items-start'}`}>
                {/* Incoming Author Name */}
                {!isOutgoing && (
                  <span className="text-xs font-bold text-[#524785] mb-1 ml-1">
                    {senderName}
                  </span>
                )}

                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
                    isOutgoing
                      ? 'bg-[#5e5ce6] text-white rounded-br-sm shadow-indigo-500/10'
                      : 'bg-[#f0eff7] text-[#1e1b29] rounded-bl-sm border border-[#e7e5f2]/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{item.message}</p>

                  {/* Metadata Row inside bubble */}
                  <div
                    className={`flex items-center justify-end space-x-1.5 mt-1.5 text-[10px] font-medium ${
                      isOutgoing ? 'text-white/75' : 'text-[#8a879e]'
                    }`}
                  >
                    <span>{formattedTime}</span>
                    {isOutgoing && (
                      <svg className="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Outgoing Avatar on Right */}
              {isOutgoing && (
                <div
                  className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5e5ce6] to-[#7362e3] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  title={senderName}
                >
                  {getInitials(senderName)}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Composer matching screenshot */}
      <div className="p-5 pt-2 bg-white">
        {sendNotice && (
          <div
            role="status"
            className="mb-2 p-2 bg-amber-50 text-amber-800 text-xs rounded-2xl border border-amber-200 flex items-center space-x-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Status: <strong>Queued</strong> (202 Accepted — message enqueued for delivery)</span>
          </div>
        )}

        {sendError && (
          <div role="alert" className="mb-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
            {sendError}
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-center">
          {/* Pill Container */}
          <div className="flex-1 flex items-center bg-[#f0eff8] rounded-2xl px-4 py-2 border border-[#e7e5f2]/60 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
            {/* Attachment paperclip */}
            <button
              type="button"
              className="text-[#8a879e] hover:text-[#1e1b29] mr-3 p-1 transition-colors"
              title="Add attachment"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              id="message-input"
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Your message"
              className="flex-1 bg-transparent text-sm text-[#1e1b29] placeholder-[#8a879e] focus:outline-none"
            />

            {/* Voice Mic icon */}
            <button
              type="button"
              className="text-[#8a879e] hover:text-[#1e1b29] mx-2 p-1 transition-colors"
              title="Voice message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>

            {/* Circular Send Button with Paper Plane */}
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="w-9 h-9 rounded-xl bg-[#5e5ce6] hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
              title="Send message"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 transform rotate-45 -ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
