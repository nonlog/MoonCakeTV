import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  expanded: boolean;
  setExpand: (exp: boolean) => void;
  toggleSidebar: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      setExpand: (exp: boolean) => set({ expanded: exp }),
      toggleSidebar: () => set((state) => ({ expanded: !state.expanded })),
    }),
    {
      name: "mc_sidebar",
    },
  ),
);
