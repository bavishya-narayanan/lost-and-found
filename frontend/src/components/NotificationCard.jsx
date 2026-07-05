import React from 'react';
import { useNavigate } from 'react-router-dom';
import { markAsRead } from '../services/notificationService';

export default function NotificationCard({ notification, onRead }) {
  const navigate = useNavigate();

  const handleAction = async () => {
    if (!notification.readStatus) {
      await markAsRead(notification._id);
      if (onRead) onRead(notification._id);
    }
    if (notification.relatedMatch) {
      navigate(`/dashboard/matches/${notification.relatedMatch}`);
    }
  };

  return (
    <div 
      className={`p-5 rounded-2xl border transition-all ${
        notification.readStatus 
          ? 'bg-[#141414] border-white/5 opacity-70' 
          : 'bg-white/5 border-white/20'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {!notification.readStatus && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
            <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
          </div>
          <p className="text-xs text-zinc-400 mb-3">{notification.message}</p>
          <span className="text-[10px] text-zinc-600 font-medium tracking-wide uppercase">
            {new Date(notification.createdAt).toLocaleDateString()} · {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button 
          onClick={handleAction}
          className="flex-shrink-0 bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          View Match
        </button>
      </div>
    </div>
  );
}
