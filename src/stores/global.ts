import { create } from "zustand";
import { persist } from "zustand/middleware";

type GlobalState = {
  siteName: string;
  disclaimer: string;
  hasSeenDisclaimer: boolean;
  setHasSeenDisclaimer: (seen: boolean) => void;
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      siteName: "月饼TV",
      setSideName: (sn: string) => set({ siteName: sn }),
      disclaimer:
        "本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。",
      hasSeenDisclaimer: false,
      setHasSeenDisclaimer: (seen: boolean) => set({ hasSeenDisclaimer: seen }),
    }),
    {
      name: "mc_global",
    },
  ),
);
