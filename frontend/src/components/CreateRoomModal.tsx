import React, { useState } from 'react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, description: string, isDirect: boolean) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState<'group' | 'direct'>('group');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this conversation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateRoom(name.trim(), description.trim(), roomType === 'direct');
      setName('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to initialize conversation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-gray-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1e1b29]">New Conversation</h2>
            <p className="text-xs text-[#8a879e]">Create a collaborative room or direct channel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a879e] hover:text-[#1e1b29] p-1.5 rounded-xl hover:bg-[#f4f3fb] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-[#fff0ee] border border-[#ff5a43]/30 text-xs text-[#ff5a43] font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Room Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#f4f3fb] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  roomType === 'group'
                    ? 'bg-white text-[#1e1b29] shadow-sm'
                    : 'text-[#8a879e] hover:text-[#1e1b29]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Team Room</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('direct')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  roomType === 'direct'
                    ? 'bg-white text-[#1e1b29] shadow-sm'
                    : 'text-[#8a879e] hover:text-[#1e1b29]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Direct Message</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="room-name"
              className="block text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-1.5"
            >
              {roomType === 'group' ? 'Room Name' : 'Recipient Username'}
            </label>
            <input
              id="room-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={roomType === 'group' ? 'e.g. Design Systems' : 'e.g. alice'}
              className="w-full px-4 py-3 bg-[#f4f3fb] border border-transparent focus:border-[#5e5ce6] focus:bg-white rounded-2xl text-sm text-[#1e1b29] placeholder-[#8a879e] transition-all outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="room-desc"
              className="block text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-1.5"
            >
              Description / Topic
            </label>
            <textarea
              id="room-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel dedicated to?"
              className="w-full px-4 py-3 bg-[#f4f3fb] border border-transparent focus:border-[#5e5ce6] focus:bg-white rounded-2xl text-sm text-[#1e1b29] placeholder-[#8a879e] transition-all outline-none resize-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5e5ce6] hover:bg-[#4d4acb] text-white text-xs font-bold shadow-lg shadow-[#5e5ce6]/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <>
                  <span>Create Conversation</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
