'use client';

import { useMemo, useState } from 'react';

import { Dazahui } from '@/schemas/dazahui';

import { PageLayout } from '../PageLayout';

export const McPlay = ({ mc_item }: { mc_item: Dazahui | null }) => {
  const [currentEpisode, setCurrentEpisode] = useState<string>('');

  const episodes = useMemo(() => {
    if (!mc_item) {
      return [];
    }
    try {
      const m3u8_kv = JSON.parse(mc_item.m3u8_urls);
      return Object.entries(m3u8_kv).map(([episode, url]) => ({
        episode,
        url: url as string,
      }));
    } catch (err) {
      console.log(err);
      return [];
    }
  }, [mc_item]);

  const currentVideoUrl = useMemo(() => {
    if (!currentEpisode) {
      return episodes[0]?.url || '';
    }
    return episodes.find((ep) => ep.episode === currentEpisode)?.url || '';
  }, [currentEpisode, episodes]);

  // Set initial episode
  useMemo(() => {
    if (episodes.length > 0 && !currentEpisode) {
      setCurrentEpisode(episodes[0].episode);
    }
  }, [episodes, currentEpisode]);

  if (!mc_item) {
    return (
      <PageLayout activePath='/play'>
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <p className='text-gray-600'>No content available</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        {/* Title and Info */}
        <div className='mb-6 flex flex-col gap-4'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            {mc_item.title}
          </h1>
          <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
            {mc_item.year && <span>{mc_item.year}</span>}
            {mc_item.region && <span>{mc_item.region}</span>}
            {mc_item.category && <span>{mc_item.category}</span>}
          </div>

          {mc_item.casting && (
            <div className='flex flex-col flex-wrap gap-2'>
              <h4 className='font-semibold text-gray-900'>演职员表</h4>
              <div className='text-sm text-gray-600'>{mc_item.casting}</div>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Video Player - Left Side */}
          <div className='lg:col-span-2'>
            <div className='bg-black rounded-lg overflow-hidden aspect-video'>
              {currentVideoUrl ? (
                <video
                  key={currentVideoUrl}
                  className='w-full h-full'
                  controls
                  autoPlay
                  src={currentVideoUrl}
                >
                  <source src={currentVideoUrl} type='application/x-mpegURL' />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className='flex items-center justify-center h-full text-white'>
                  <p>No video available</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            {mc_item.summary && (
              <div className='mt-4 bg-white rounded-lg shadow p-4'>
                <h3 className='text-lg font-semibold mb-2'>剧情简介</h3>
                <p className='text-gray-700 text-sm leading-relaxed'>
                  {mc_item.summary}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {mc_item.cover_image && (
              <div className='mt-4 bg-white rounded-lg shadow p-4'>
                {mc_item.cover_image && (
                  <div className='mb-4'>
                    <img
                      src={mc_item.cover_image}
                      alt={mc_item.title}
                      className='w-full rounded-lg'
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Episodes List - Right Side */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow'>
              <div className='p-4 border-b flex items-center gap-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  剧集列表
                </h3>
                <p className='text-sm text-gray-600'>共 {episodes.length} 集</p>
              </div>
              <div className='max-h-96 overflow-y-auto'>
                {episodes.map(({ episode, url }) => (
                  <button
                    key={episode}
                    onClick={() => setCurrentEpisode(episode)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      currentEpisode === episode
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-medium text-gray-900'>
                        {episode}
                      </span>
                      {currentEpisode === episode && (
                        <span className='text-blue-500 text-sm'>正在播放</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};
