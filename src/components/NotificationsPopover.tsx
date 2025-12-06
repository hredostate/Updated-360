import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';
import { BellIcon } from './common/icons';

interface NotificationsPopoverProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: () => void;
}

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
};

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, unreadCount, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      onMarkAsRead();
    }
  }, [isOpen, unreadCount, onMarkAsRead]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-500/10">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className="p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start space-x-3">
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>}
                  <div className={notif.is_read ? 'pl-5' : ''}>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{notif.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {timeSince(new Date(notif.created_at))} ago
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">No new notifications.</p>
            )}
          </div>
           <div className="p-2 bg-slate-50 dark:bg-slate-900/50 text-center">
            <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPopover;