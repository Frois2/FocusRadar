import { create } from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  // Called once on app mount — restores session from stored tokens
  init: async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      // Access token expired — try to refresh
      try {
        await get().refresh();
        const { data } = await api.get('/auth/me');
        set({ user: data, loading: false });
      } catch {
        get().clearTokens();
        set({ loading: false });
      }
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    get().storeTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    get().storeTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
  },

  refresh: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const { data } = await api.post('/auth/refresh', { refreshToken });
    get().storeTokens(data.accessToken, data.refreshToken);
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Fail silently — still clear local state
    }
    get().clearTokens();
    set({ user: null });
  },

  updateUser: (user) => set({ user }),

  storeTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
}));

export default useAuthStore;
