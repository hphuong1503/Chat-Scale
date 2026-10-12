import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(false);
  const [activeTheme, setActiveTheme] = useState('periwinkle');

  if (!isOpen) return null;

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
            <h2 className="text-lg font-bold text-[#1e1b29]">Preferences</h2>
            <p className="text-xs text-[#8a879e]">Customize your workspace experience</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a879e] hover:text-[#1e1b29] p-1.5 rounded-xl hover:bg-[#f4f3fb] transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="mt-5 space-y-4">
          {/* Section: Chat Behavior */}
          <div>
            <h3 className="text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-2.5">
              Messaging
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3fb]">
                <div>
                  <div className="text-xs font-semibold text-[#1e1b29]">Enter key to send</div>
                  <div className="text-[11px] text-[#8a879e]">Press Enter to send, Shift+Enter for newline</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnterToSend(!enterToSend)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    enterToSend ? 'bg-[#5e5ce6]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      enterToSend ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3fb]">
                <div>
                  <div className="text-xs font-semibold text-[#1e1b29]">Audio chime</div>
                  <div className="text-[11px] text-[#8a879e]">Play soft chime on incoming messages</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    soundEnabled ? 'bg-[#5e5ce6]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f4f3fb]">
                <div>
                  <div className="text-xs font-semibold text-[#1e1b29]">Desktop notifications</div>
                  <div className="text-[11px] text-[#8a879e]">Push banner alerts when tab is in background</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDesktopAlerts(!desktopAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    desktopAlerts ? 'bg-[#5e5ce6]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      desktopAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Appearance */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#8a879e] uppercase tracking-wider mb-2.5">
              Accent Theme
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'periwinkle', name: 'Periwinkle', color: '#5e5ce6' },
                { id: 'violet', name: 'Violet', color: '#7362e3' },
                { id: 'indigo', name: 'Indigo', color: '#4338ca' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTheme(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                    activeTheme === t.id
                      ? 'border-[#5e5ce6] bg-[#f4f3fb] shadow-sm'
                      : 'border-transparent bg-[#f4f3fb]/60 hover:bg-[#f4f3fb]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: t.color }} />
                  <span className="text-[11px] font-bold text-[#1e1b29]">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-[#5e5ce6] hover:bg-[#4d4acb] text-white text-xs font-bold shadow-lg shadow-[#5e5ce6]/25 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
