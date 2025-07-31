import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Dazahui } from '@/schemas/dazahui';

type UserState = {
  watchHistry: Dazahui[];
  setWatchHistory: (dazahui: Dazahui | null | undefined) => void;
  lastUpdatedAt: string; // iso
  setLastUpdatedAt: (ts: string) => void;
  localPassword: string;
  setLocalPasssword: (p: string) => void;
  adultMode: string; // iso timestamp string of when adult mode is turned on
  setAdultMode: (ts: string) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      watchHistry: [],
      setWatchHistory: (dazahui: Dazahui | null | undefined) =>
        set((state) => ({
          // if ddazahui is empty, clear watch history
          watchHistry: dazahui ? [...state.watchHistry, dazahui] : [],
        })),
      lastUpdatedAt: '',
      setLastUpdatedAt: (ts: string) => set({ lastUpdatedAt: ts }),
      localPassword: '',
      setLocalPasssword: (p: string) => set({ localPassword: p }),
      adultMode: '',
      setAdultMode: (ts: string) => set({ adultMode: ts }),
    }),
    {
      name: 'mc_user',
    },
  ),
);
