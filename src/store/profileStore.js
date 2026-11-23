import { create } from 'zustand';

export const useProfileStore = create((set, get) => ({
  mode: 'public', // 'public' | 'stranger'
  interests: ['Coffee & Cafes', 'Art & Galleries', 'Live Music'],
  intents: ['romance'],
  revealedUserIds: [], // User IDs where stranger profile has been revealed to us
  likedUserIds: [],
  passedUserIds: [],

  // Live Location & Snap Map Privacy State
  ghostMode: false, // When true, your pin is hidden from everyone on the map
  locationSharing: 'sparks_only', // 'all' | 'sparks_only' | 'off'
  userLocation: {
    lat: 40.7128,
    lng: -74.006,
    name: 'Downtown, NY',
    isGps: false,
    radius: '1.2 mi approx',
  },

  setGhostMode: (ghostMode) => set({ ghostMode }),
  toggleGhostMode: () => set((state) => ({ ghostMode: !state.ghostMode })),
  setLocationSharing: (locationSharing) => set({ locationSharing }),
  setUserLocation: (userLocation) => set({ userLocation }),

  setMode: (mode) => set({ mode }),
  
  toggleMode: () => {
    const current = get().mode;
    set({ mode: current === 'public' ? 'stranger' : 'public' });
  },

  setInterests: (interests) => set({ interests }),

  toggleInterest: (interest) => {
    const list = get().interests;
    if (list.includes(interest)) {
      set({ interests: list.filter((i) => i !== interest) });
    } else {
      if (list.length < 5) {
        set({ interests: [...list, interest] });
      }
    }
  },

  setIntents: (intents) => set({ intents }),

  toggleIntent: (intentId) => {
    const list = get().intents;
    if (list.includes(intentId)) {
      set({ intents: list.filter((i) => i !== intentId) });
    } else {
      set({ intents: [...list, intentId] });
    }
  },

  revealUser: (userId) => {
    const revealed = get().revealedUserIds;
    if (!revealed.includes(userId)) {
      set({ revealedUserIds: [...revealed, userId] });
    }
  },

  isUserRevealed: (userId) => {
    return get().revealedUserIds.includes(userId);
  },

  likeUser: (userId) => {
    const liked = get().likedUserIds;
    if (!liked.includes(userId)) {
      set({ likedUserIds: [...liked, userId] });
    }
  },

  passUser: (userId) => {
    const passed = get().passedUserIds;
    if (!passed.includes(userId)) {
      set({ passedUserIds: [...passed, userId] });
    }
  }
}));
