import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Dazahui } from "@/schemas/dazahui";

import { MediaCard } from "../common/media-card";

import { ApiResponse } from "@/types/common";

export const RandomMedia = ({
  handleCardClick,
}: {
  handleCardClick: (dazahui: Dazahui) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [random, setRandom] = useState<Dazahui[] | null>(null);
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
    <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
      <div className='max-w-[95%]'>
        <div className='mb-8'>
          <div className='flex items-center gap-4'>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
              随机推荐
            </h2>
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
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
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
  );
};
