import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  X,
  MessageSquare,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Volume2,
  Trash2,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import {
  playMessageSound,
  playFriendRequestSound,
  playFriendAcceptSound,
} from '../utils/sound';

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const {
    notifications,
    isDropdownOpen,
    closeDropdown,
    markAsRead,
    markAllAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    clearNotifications,
    syncNotifications,
  } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Sync notifications on mount & when dropdown opens
  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  if (!isDropdownOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 max-w-[92vw] bg-gray-950/95 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-slide-down"
    >
      {/* Header (Instagram Activity Style) */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-white tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] font-bold text-white shadow-sm">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold px-2 py-1 rounded-lg hover:bg-pink-500/10 transition-colors cursor-pointer"
            >
              Mark read
            </button>
          )}
          <button
            type="button"
            onClick={closeDropdown}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-900/60 p-1">
        {notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-gray-600 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-400">No new activity yet</p>
            <p className="text-[11px] text-gray-500">
              When friends message, send requests, or accept, you will see them here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.actionUrl && notif.type !== 'friend_request') {
                    closeDropdown();
                    navigate(notif.actionUrl);
                  }
                }}
                className={`p-3 rounded-2xl transition-all flex items-start gap-3 hover:bg-gray-900/50 cursor-pointer ${
                  !notif.read ? 'bg-pink-950/20 border-l-2 border-pink-500' : ''
                }`}
              >
                {/* User Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <img
                    src={notif.avatar}
                    alt={notif.senderName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-800"
                  />
                  {notif.type === 'friend_request' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <UserPlus className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {notif.type === 'message' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                      <MessageSquare className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {notif.type === 'friend_accept' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <UserCheck className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {notif.type === 'match' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                  {notif.type === 'system' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <ShieldCheck className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 leading-snug">
                    <span className="font-bold text-white mr-1">{notif.senderName}</span>
                    <span className="text-gray-300">{notif.message}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{notif.timeAgo}</p>

                  {/* Actions for Friend Request */}
                  {notif.type === 'friend_request' && (
                    <div className="mt-2 flex items-center gap-2">
                      {notif.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptFriendRequest(notif.id, notif.senderId);
                            }}
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              declineFriendRequest(notif.id, notif.senderId);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {notif.status === 'accepted' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Friends</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeDropdown();
                              navigate(`/app/chats/${notif.senderId}`);
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Message
                          </button>
                        </div>
                      )}
                      {notif.status === 'declined' && (
                        <span className="text-[11px] text-gray-500">Request declined</span>
                      )}
                    </div>
                  )}

                  {/* Actions for Match */}
                  {notif.type === 'match' && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDropdown();
                          navigate(notif.actionUrl || `/app/chats/${notif.senderId}`);
                        }}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-pink-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Chat Now</span>
                      </button>
                    </div>
                  )}

                  {/* Actions for Message or Accept */}
                  {(notif.type === 'message' || notif.type === 'friend_accept') && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDropdown();
                          navigate(notif.actionUrl || `/app/chats/${notif.senderId}`);
                        }}
                        className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-pink-600 text-gray-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  )}

                  {/* Actions for System */}
                  {notif.type === 'system' && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDropdown();
                          navigate(notif.actionUrl || '/app/profile/me');
                        }}
                        className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-bold transition-all cursor-pointer"
                      >
                        View Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Audio Preview Quick Test */}
      <div className="p-2.5 bg-gray-900/80 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Sound Alerts:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={playMessageSound}
            className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Test message received sound"
          >
            Msg
          </button>
          <button
            type="button"
            onClick={playFriendRequestSound}
            className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Test friend request sound"
          >
            Req
          </button>
          <button
            type="button"
            onClick={playFriendAcceptSound}
            className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Test friend accept sound"
          >
            Accept
          </button>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="p-1 text-gray-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
              title="Clear all notices"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
