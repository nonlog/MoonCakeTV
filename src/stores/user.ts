import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Dazahui } from "@/schemas/dazahui";

type UserState = {
  currentUserId: string;
  watchHistory: Dazahui[];
  setWatchHistory: (dazahui?: Dazahui) => void;
  lastUpdatedAt: string; // iso
  setLastUpdatedAt: (ts: string) => void;
  localPassword: string;
  setLocalPassword: (p?: string) => void;
  adultMode: string; // iso timestamp string of when adult mode is turned on
  setAdultMode: (ts: string) => void;
  bookmarks: Record<string, Dazahui[] | null>;
  updateBookmarks: (
    user_id: string,
    item: Dazahui,
    action: "add" | "delete",
  ) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: "me",
      watchHistory: [],
      setWatchHistory: (dazahui?: Dazahui) =>
        set((state) => {
          if (dazahui && dazahui.mc_id) {
            const newHistory = [...state.watchHistory];
            const existingIndex = newHistory.findIndex(
              (wh) => wh.mc_id === dazahui.mc_id,
            );

            if (existingIndex !== -1) {
              // Remove existing item and add it to the front
              newHistory.splice(existingIndex, 1);
              newHistory.unshift(dazahui);
            } else {
              // Add new item to front
              newHistory.unshift(dazahui);
            }

            return {
              watchHistory: newHistory.slice(0, 100), // 100 items at most
            };
          }

          return {
            // if dazahui is empty, clear watch history
            watchHistory: [],
          };
        }),
      lastUpdatedAt: "",
      setLastUpdatedAt: (ts: string) => set({ lastUpdatedAt: ts }),
      localPassword: "",
      setLocalPassword: (p?: string) => set({ localPassword: p }),
      adultMode: "",
      setAdultMode: (ts: string) => set({ adultMode: ts }),
      bookmarks: {},
      updateBookmarks: (user_id: string, item: Dazahui, action = "add") => {
        set((state) => {
          if (action === "add") {
            return {
              bookmarks:
                state.bookmarks &&
                state.bookmarks[user_id] &&
                Array.isArray(state.bookmarks[user_id])
                  ? {
                      ...state.bookmarks,
                      [user_id]: [item, ...state.bookmarks[user_id]],
                    }
                  : {
                      ...state.bookmarks,
                      [user_id]: [item],
                    },
            };
          }

          if (action === "delete") {
            return {
              bookmarks: {
                ...state.bookmarks,
                [user_id]:
                  state.bookmarks[user_id]?.filter(
                    (bookmark) => bookmark.mc_id !== item.mc_id,
                  ) || null,
              },
            };
          }

          // Fallback to return current state if no action matches
          return {};
        });
      },
    }),
    {
      name: "mc_user",
    },
  ),
);
