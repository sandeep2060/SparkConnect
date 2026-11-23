import { create } from 'zustand';
import {
  playMessageSound,
  playFriendRequestSound,
  playFriendAcceptSound,
  triggerBrowserNotification,
} from '../utils/sound';
import { acceptFriendRequestApi, rejectFriendRequestApi } from '../api/social';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'friend_request',
    senderId: 'user-elena',
    senderName: 'Elena Rostova',
    username: 'elena_r',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    title: 'Friend Request',
    message: 'sent you a friend request.',
    timeAgo: '5m ago',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    status: 'pending', // 'pending' | 'accepted' | 'declined'
    actionUrl: '/app/messages',
  },
  {
    id: 'notif-2',
    type: 'message',
    senderId: 'user-marcus',
    senderName: 'Marcus Vance',
    username: 'marcus_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    title: 'New Snap Message',
    message: 'sent you a disappearing photo snap 📸',
    timeAgo: '32m ago',
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    read: false,
    actionUrl: '/app/messages',
  },
  {
    id: 'notif-3',
    type: 'friend_accept',
    senderId: 'user-maya',
    senderName: 'Maya Carter',
    username: 'maya_c',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    title: 'Request Accepted',
    message: 'accepted your friend request. You can now chat and maintain streaks!',
    timeAgo: '2h ago',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/app/messages',
  },
  {
    id: 'notif-4',
    type: 'system',
    senderName: 'SparkConnect Team',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    title: 'Profile Verified',
    message: 'Your 18+ ID and live photo verification is officially verified with a blue badge! ⭐',
    timeAgo: '1d ago',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/app/profile/me',
  },
];

export const useNotificationStore = create((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  isDropdownOpen: false,

  toggleDropdown: () => set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),
  closeDropdown: () => set({ isDropdownOpen: false }),
  openDropdown: () => set({ isDropdownOpen: true }),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  addNotification: ({
    type = 'message',
    senderId,
    senderName,
    username,
    avatar,
    title,
    message,
    actionUrl = '/app/messages',
  }) => {
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      senderId,
      senderName: senderName || 'Someone',
      username: username || '',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      title: title || (type === 'message' ? 'New Message' : type === 'friend_request' ? 'Friend Request' : 'Notification'),
      message: message || '',
      timeAgo: 'Just now',
      timestamp: new Date(),
      read: false,
      status: type === 'friend_request' ? 'pending' : undefined,
      actionUrl,
    };

    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));

    // Trigger browser alert + sound
    triggerBrowserNotification(
      newNotif.title,
      `${newNotif.senderName} ${newNotif.message}`,
      type
    );
  },

  acceptFriendRequest: async (notifId, senderId) => {
    try {
      if (senderId) {
        await acceptFriendRequestApi(senderId);
      }
      playFriendAcceptSound();
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notifId
            ? { ...n, status: 'accepted', read: true }
            : n
        ),
      }));
    } catch (err) {
      console.error('Error accepting friend request from notice:', err);
    }
  },

  declineFriendRequest: async (notifId, senderId) => {
    try {
      if (senderId) {
        await rejectFriendRequestApi(senderId);
      }
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notifId
            ? { ...n, status: 'declined', read: true }
            : n
        ),
      }));
    } catch (err) {
      console.error('Error declining friend request from notice:', err);
    }
  },

  clearNotifications: () => set({ notifications: [] }),
}));
