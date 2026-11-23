import { create } from 'zustand';
import {
  playMessageSound,
  playFriendRequestSound,
  playFriendAcceptSound,
  triggerBrowserNotification,
} from '../utils/sound';
import { acceptFriendRequestApi, rejectFriendRequestApi } from '../api/social';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
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
