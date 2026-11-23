import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';

export const Navbar = ({ title }) => {
  const { user } = useAuthStore();
  const { notifications, isDropdownOpen, toggleDropdown, syncNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      syncNotifications();
      const interval = setInterval(() => {
        syncNotifications();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user?.id, syncNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <Link to="/app" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black text-white tracking-tight">SparkConnect</span>
            </div>
          </Link>

          {title && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <span className="text-sm font-bold text-gray-200">{title}</span>
            </div>
          )}
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2.5">
          {/* Instagram-style Notifications Bell */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className={`relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-800/80 transition-all min-h-touch min-w-touch flex items-center justify-center cursor-pointer ${
                isDropdownOpen ? 'bg-gray-900 text-white ring-2 ring-pink-500/40' : ''
              }`}
              aria-label="Activity Notifications"
              title="Activity & Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            <NotificationDropdown />
          </div>

          {/* Profile Avatar */}
          <Link
            to="/app/profile/me"
            className="p-0.5 rounded-full hover:ring-2 hover:ring-pink-500 transition-all min-h-touch min-w-touch flex items-center justify-center"
            title="My Profile & Settings"
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name || 'User'}
              size="sm"
              status="online"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
