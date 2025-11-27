"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PageLayout from "@/components/common/page-layout";
import { DoubanTags } from "@/components/douban/tags";
import { RandomMedia } from "@/components/home/random-media";

import { useGlobalStore } from "@/stores/global";

import { VodObject } from "@/schemas/vod";

export default function HomePage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const { disclaimer, hasSeenDisclaimer, setHasSeenDisclaimer, displayDouban } =
    useGlobalStore();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleCloseAnnouncement = () => {
    setHasSeenDisclaimer(true);
  };

  const handleCardClick = (vod: VodObject) => {
    router.push(`/play?vod_id=${vod.source_vod_id}&vod_src=${vod.source}`);
  };

  return (
    <PageLayout>
      {isHydrated && displayDouban && <DoubanTags />}
      <RandomMedia handleCardClick={handleCardClick} />
      {isHydrated && !hasSeenDisclaimer && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs dark:bg-black/70 p-4 transition-opacity duration-300 ${
            hasSeenDisclaimer && "opacity-0 pointer-events-none"
          }`}
        >
          <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 transform transition-all duration-300 hover:shadow-2xl'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-2xl font-bold tracking-tight text-gray-800 dark:text-white border-b border-green-500 pb-1'>
                提示
              </h3>
              <button
                onClick={handleCloseAnnouncement}
                className='text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white transition-colors'
                aria-label='关闭'
              ></button>
            </div>
            <div className='mb-6'>
              <div className='relative overflow-hidden rounded-lg mb-4 bg-green-50 dark:bg-green-900/20'>
                <div className='absolute inset-y-0 left-0 w-1.5 bg-green-500 dark:bg-green-400'></div>
                <p className='ml-4 text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {disclaimer}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseAnnouncement}
              className='w-full rounded-lg bg-linear-to-r from-green-600 to-green-700 px-4 py-3 text-white font-medium shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 transform hover:-translate-y-0.5'
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
