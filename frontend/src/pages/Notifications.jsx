import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import NotificationCard from '../components/NotificationCard';
import { getNotifications } from '../services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = (id) => {
    setNotifications((prev) => 
      prev.map((notif) => notif._id === id ? { ...notif, readStatus: true } : notif)
    );
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-zinc-400 mt-2">Stay updated on matches and messages.</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              {unreadCount} Unread
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-zinc-400">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((notification) => (
              <NotificationCard 
                key={notification._id} 
                notification={notification} 
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
