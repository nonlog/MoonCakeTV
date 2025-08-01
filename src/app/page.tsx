/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MediaCard } from "@/components/common/media-card";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";

import { useGlobalStore } from "@/stores/global";

import { Dazahui } from "@/schemas/dazahui";

import { ApiResponse } from "@/types/common";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const { disclaimer, hasSeenDisclaimer, setHasSeenDisclaimer } =
    useGlobalStore();

  const [random, setRandom] = useState<Dazahui[] | null>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleCloseAnnouncement = () => {
    setHasSeenDisclaimer(true);
  };

  const handleCardClick = (dazahui: Dazahui) => {
    router.push(`/play?mc_id=${dazahui.mc_id}`);
  };

  const triggerRandom = () => {
    setLoading(true);
    fetch("https://s1.m3u8.io/v1/random")
      .then((res) => {
        return res.json() as Promise<ApiResponse<{ items: Dazahui[] } | null>>;
      })
      .then((json) => {
        setRandom(json.data?.items || null);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    triggerRandom();
  }, []);

  return (
    <PageLayout>
      <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='max-w-[95%] mx-auto'>
          <div className='mb-8'>
            <div className='flex items-center gap-4'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                随机推荐
              </h1>
              <Button
                size='lg'
                className='bg-purple-900 text-white text-xl cursor-pointer'
                onClick={triggerRandom}
              >
                换一批
              </Button>
            </div>

            <p className='text-gray-600 dark:text-gray-400'>为您推荐精选内容</p>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500'></div>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {random?.map((item, index) => (
                <MediaCard
                  key={item.mc_id || index}
                  dazahui={item}
                  onClick={() => handleCardClick(item)}
                  showSpeedTest
                  userId='me'
                />
              )) || (
                <div className='col-span-full text-center py-12'>
                  <p className='text-gray-500 dark:text-gray-400'>暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
