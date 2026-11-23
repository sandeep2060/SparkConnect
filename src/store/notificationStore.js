import { create } from 'zustand';
import {
  playMessageSound,
  playFriendRequestSound,
  playFriendAcceptSound,
  triggerBrowserNotification,
} from '../utils/sound';
import { formatTimeAgo } from '../utils/helpers';
import { acceptFriendRequestApi, rejectFriendRequestApi, getPendingFriendRequestsApi } from '../api/social';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isDropdownOpen: false,

  toggleDropdown: () => {
    const nextState = !get().isDropdownOpen;
    set({ isDropdownOpen: nextState });
    if (nextState) {
      get().syncNotifications();
    }
  },
  closeDropdown: () => set({ isDropdownOpen: false }),
  openDropdown: () => {
    set({ isDropdownOpen: true });
    get().syncNotifications();
  },

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

  syncNotifications: async () => {
    try {
      const pending = await getPendingFriendRequestsApi();
      if (Array.isArray(pending)) {
        set((state) => {
          const currentList = [...state.notifications];
          let updated = false;

          for (const req of pending) {
            const exists = currentList.some(
              (n) => n.requestId === req.requestId || (n.type === 'friend_request' && n.senderId === req.sender.id)
            );

            if (!exists) {
              const notifItem = {
                id: 'fr_' + req.requestId,
                requestId: req.requestId,
                type: 'friend_request',
                senderId: req.sender.id,
                senderName: req.sender.name || req.sender.username,
                username: req.sender.username,
                avatar: req.sender.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                title: 'Friend Request',
                message: 'sent you a friend request.',
                timeAgo: formatTimeAgo(req.createdAt),
                timestamp: new Date(req.createdAt),
                read: false,
                status: 'pending',
                actionUrl: `/app/profile/${req.sender.id}`,
              };
              currentList.unshift(notifItem);
              updated = true;
            }
          }

          return updated ? { notifications: currentList } : state;
        });
      }
    } catch (e) {
      console.warn('Sync notifications notice:', e.message);
    }
  },

  addNotification: ({
    type = 'message',
    senderId,
    senderName,
    username,
    avatar,
    title,
    message,
    actionUrl = '/app/chats',
  }) => {
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      senderId,
      senderName: senderName || 'Someone',
      username: username || '',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      title:
        title ||
        (type === 'message'
          ? 'New Message'
          : type === 'friend_request'
          ? 'Friend Request'
          : type === 'match'
          ? "It's a Match! 🎉"
          : 'Notification'),
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

    // Play sound based on notification type
    if (type === 'friend_request') {
      playFriendRequestSound();
    } else if (type === 'message') {
      playMessageSound();
    } else if (type === 'friend_accept' || type === 'match') {
      playFriendAcceptSound();
    }

    // Trigger browser alert + sound
    triggerBrowserNotification(
      newNotif.title,
      `${newNotif.senderName} ${newNotif.message}`,
      type
    );
  },

  acceptFriendRequest: async (notifId, senderId) => {
    try {
      let res;
      if (senderId) {
        res = await acceptFriendRequestApi(senderId);
      }
      playFriendAcceptSound();
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notifId
            ? {
                ...n,
                status: 'accepted',
                read: true,
                actionUrl: `/app/chats/${res?.conversationId || senderId}`,
              }
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
