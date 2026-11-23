import { create } from 'zustand';
import { CURRENT_MOCK_USER, ADMIN_MOCK_USER } from '../utils/mockData';
import { loginApi } from '../api/auth';

const AUTH_STORAGE_KEY = 'sparkconnect_auth';

// Load initial state from localStorage if available
const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isAuthenticated === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored auth:', err);
  }
  // Default to pre-logged in mock user for initial preview, but allow full logout/login
  return {
    user: CURRENT_MOCK_USER,
    token: 'mock-jwt-token-alex-rivera-123',
    isAuthenticated: true,
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

  // Toggle user role between user and admin for quick review demo
  toggleRole: () => {
    const currentUser = get().user;
    if (!currentUser) return;
    const newRole = currentUser.role === 'admin' ? 'user' : 'admin';
    get().updateProfile({ role: newRole });
  }
}));
