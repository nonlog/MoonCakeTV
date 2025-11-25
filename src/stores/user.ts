import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Dazahui } from "@/schemas/dazahui";

type UserState = {
  currentUserId: string;
  watchHistory: Dazahui[];
  setWatchHistory: (dazahui?: Dazahui) => void;
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
