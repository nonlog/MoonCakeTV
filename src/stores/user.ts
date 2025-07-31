import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserState = {
  watchHistry: string[];
  setWatchHistory: (mc_id: string) => void;
};

export const useGlobalStore = create<UserState>()(
  persist(
    (set) => ({
      watchHistry: [],
      setWatchHistory: (mc_id: string) =>
        set((state) => ({
          watchHistry: Array.from(new Set([...state.watchHistry, mc_id])),
        })),
    }),
    {
      name: 'mc_user',
    },
  ),
);
