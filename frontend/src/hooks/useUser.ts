'use client';

import { create } from 'zustand';
import { StateCreator } from 'zustand';

interface User {
  id: number;
  email: string;
  full_name: string;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
}

const createUserStore: StateCreator<UserStore> = (set) => ({
  user: null,
  loading: true,
  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  fetchUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ user: null, loading: false });
        return;
      }

      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, loading: false });
      } else {
        localStorage.removeItem('token');
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      set({ user: null, loading: false });
    }
  },
});

export const useUser = create<UserStore>(createUserStore); 