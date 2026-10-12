import React from 'react';

export const NewsFeedView: React.FC = () => {
  const articles = [
    {
      id: 1,
      title: 'Design System 2.0 Rollout & Unified Components',
      category: 'Product Update',
      date: 'Today at 09:30 AM',
      author: 'Design Ops',
      badgeColor: 'bg-[#5e5ce6]',
      summary:
        'We have completely overhauled the client UI with squircle geometry, elevated glass containers, and topography canvas backgrounds.',
      reactions: '🔥 18 • ❤️ 24',
    },
    {
      id: 2,
      title: 'Scheduled Database Maintenance & Outbox Replay Verification',
      category: 'Infrastructure',
      date: 'Yesterday at 4:15 PM',
      author: 'Backend Engineering',
      badgeColor: 'bg-[#7362e3]',
      summary:
        'All Celery tasks and WebSocket channels will undergo zero-downtime maintenance. Messages queued during any socket interruption will be automatically replayed.',
      reactions: '👍 31 • 🚀 12',
    },
    {
      id: 3,
      title: 'Welcome New Team Members to ChatApp Core',
      category: 'Community',
      date: 'Oct 10, 2026',
      author: 'People Team',
      badgeColor: 'bg-[#ff5a43]',
      summary:
        'Please give a warm welcome to Alex Hunt and Jasmin Lowery joining our Real-time Infrastructure guild!',
      reactions: '🎉 45 • 👋 28',
    },
  ];

  return (
    <div className="flex-1 h-full bg-[#f4f3fb] flex flex-col overflow-y-auto p-6 md:p-8 select-none">
      {/* Top Banner */}
      <div className="max-w-3xl w-full mx-auto mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#5e5ce6] text-white flex items-center justify-center shadow-md shadow-indigo-900/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1b29]">Workspace News & Updates</h1>
            <p className="text-xs text-[#8a879e]">Official announcements, release notes, and team milestones</p>
          </div>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="max-w-3xl w-full mx-auto space-y-4">
        {articles.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full uppercase tracking-wider ${item.badgeColor}`}
              >
                {item.category}
              </span>
              <span className="text-xs font-medium text-[#8a879e]">{item.date}</span>
            </div>

            <h2 className="text-base font-bold text-[#1e1b29] mb-2">{item.title}</h2>
            <p className="text-xs text-[#524f65] leading-relaxed mb-4">{item.summary}</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className="text-[#8a879e]">Posted by <strong className="text-[#1e1b29]">{item.author}</strong></span>
              <div className="px-3 py-1 bg-[#f4f3fb] rounded-full text-[11px] font-semibold text-[#5e5ce6]">
                {item.reactions}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
