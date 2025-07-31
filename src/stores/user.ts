import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Dazahui } from '@/schemas/dazahui';

type UserState = {
  watchHistory: Dazahui[];
  setWatchHistory: (dazahui?: Dazahui) => void;
  lastUpdatedAt: string; // iso
  setLastUpdatedAt: (ts: string) => void;
  localPassword: string;
  setLocalPassword: (p: string) => void;
  adultMode: string; // iso timestamp string of when adult mode is turned on
  setAdultMode: (ts: string) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      watchHistory: [],
      setWatchHistory: (dazahui?: Dazahui) =>
        set((state) => {
          if (dazahui && dazahui.mc_id) {
            const existingDazahui = state.watchHistory.find(
              (wh) => wh.mc_id === dazahui.mc_id,
            );

            if (!existingDazahui) {
              // Add new item to front
              return {
                watchHistory: [dazahui, ...state.watchHistory].slice(0, 20), // 20 items at most
              };
            }

            return {};
          }

          return {
            // if dazahui is empty, clear watch history
            watchHistory: [],
          };
        }),
      lastUpdatedAt: '',
      setLastUpdatedAt: (ts: string) => set({ lastUpdatedAt: ts }),
      localPassword: '',
      setLocalPassword: (p: string) => set({ localPassword: p }),
      adultMode: '',
      setAdultMode: (ts: string) => set({ adultMode: ts }),
    }),
    {
      name: 'mc_user',
    },
  ),
);
