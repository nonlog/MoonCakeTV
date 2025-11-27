import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

type UserState = {
  currentUserId: string;
  watchHistory: VodObject[];
  setWatchHistory: (vod?: VodObject) => void;
  bookmarks: Record<string, VodObject[] | null>;
  updateBookmarks: (
    user_id: string,
    item: VodObject,
    action: "add" | "delete",
  ) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: "me",
      watchHistory: [],
      setWatchHistory: (vod?: VodObject) =>
        set((state) => {
          if (vod && vod.source && vod.source_vod_id) {
            const newHistory = [...state.watchHistory];
            const vodId = getVodUniqueId(vod);
            const existingIndex = newHistory.findIndex(
              (wh) => getVodUniqueId(wh) === vodId,
            );

            if (existingIndex !== -1) {
              // Remove existing item and add it to the front
              newHistory.splice(existingIndex, 1);
              newHistory.unshift(vod);
            } else {
              // Add new item to front
              newHistory.unshift(vod);
            }

            return {
              watchHistory: newHistory.slice(0, 100), // 100 items at most
            };
          }

          return {
            // if vod is empty, clear watch history
            watchHistory: [],
          };
        }),
      bookmarks: {},
      updateBookmarks: (user_id: string, item: VodObject, action = "add") => {
        set((state) => {
          const itemId = getVodUniqueId(item);

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
                    (bookmark) => getVodUniqueId(bookmark) !== itemId,
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
