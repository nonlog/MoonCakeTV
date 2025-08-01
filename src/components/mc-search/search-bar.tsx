import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function McSearchBar({
  handleSearch,
  keyword,
  handleKeywordChange,
}: {
  handleSearch: () => void;
  keyword: string;
  handleKeywordChange: (value: string) => void;
}) {
  return (
    <div className='w-full max-w-4xl mx-auto flex items-center gap-4'>
      <span className='flex items-center justify-center h-12 w-12 bg-transparent mr-[-64px] z-10'>
        <Search className='h-5 w-5 text-gray-400 dark:text-gray-500' />
      </span>
      <input
        id='searchInput'
        type='text'
        value={keyword}
        autoFocus
        onKeyUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
        onChange={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleKeywordChange(e.target.value);
        }}
        placeholder='搜索电影、电视剧...'
        className='rounded-lg bg-gray-50/80 w-full h-12 pl-12 pr-6 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white border border-purple-900/50 shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:bg-gray-700 dark:border-gray-700'
      />
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSearch();
        }}
        size='lg'
        className='cursor-pointer bg-purple-900 px-4 py-2 w-20 h-12 text-xl text-white'
      >
        搜索
      </Button>
    </div>
  );
}
