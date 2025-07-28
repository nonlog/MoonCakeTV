'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import PageLayout from '@/components/PageLayout';

// export default function SearchPage() {
//   return (
//     <Suspense>
//       <SearchComponent />
//     </Suspense>
//   );
// }

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch(`https://s1.m3u8.io/v1/search?keyword=${keyword}`);
    const data = await res.json();
    console.log(data);
  };
  return (
    <PageLayout activePath='/search'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
        <form
          onSubmit={handleSearch}
          className='w-4xl mx-auto min-w-0 shrink-1 flex items-center'
        >
          <span className='flex items-center justify-center h-12 w-12 bg-transparent mr-[-50px] z-10'>
            <Search className='h-5 w-5 text-gray-400 dark:text-gray-500' />
          </span>
          <input
            id='searchInput'
            type='text'
            value={keyword}
            autoFocus
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='搜索电影、电视剧...'
            className='rounded-lg bg-gray-50/80 w-full h-12 pl-12 pr-6 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-green-400 focus:bg-white border border-gray-200/50 shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:bg-gray-700 dark:border-gray-700'
          />
        </form>
      </div>
    </PageLayout>
  );
}
