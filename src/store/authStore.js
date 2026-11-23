import { create } from 'zustand';
import { loginApi } from '../api/auth';

const AUTH_STORAGE_KEY = 'sparkconnect_auth';

// Load initial state from localStorage only if a valid authenticated user exists
const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure it is a legitimate authenticated user, not a legacy mock account
      if (
        parsed &&
        parsed.isAuthenticated === true &&
        parsed.user &&
        parsed.user.id !== 'user_current' &&
        parsed.token &&
        !parsed.token.includes('mock-jwt-token')
      ) {
        return parsed;
      }
      // If legacy mock auth was stored, purge it
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to parse stored auth:', err);
  }

  // Secure default: Unauthenticated. User MUST sign up or log in.
  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

const initial = loadStoredAuth();

export const useAuthStore = create((set, get) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: initial.isAuthenticated,

  login: async (email, password) => {
    const res = await loginApi({ email, password });
    const nextState = {
      user: res.user,
      token: res.token,
      isAuthenticated: true,
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.error(e);
    }

    set(nextState);
    return res.user;
  },

  logout: () => {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      );
    } catch (e) {
      console.error(e);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => {
    const nextState = {
      user,
      token: get().token || 'mock-token',
      isAuthenticated: !!user,
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.error(e);
    }
    set({ user, isAuthenticated: !!user });
  },

  updateProfile: (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    const nextState = {
      user: updatedUser,
      token: get().token,
      isAuthenticated: true,
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.error(e);
    }
    set({ user: updatedUser });
  },
}));
