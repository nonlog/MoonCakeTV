'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import McSearchBar from '@/components/mc-search/search-bar';
import PageLayout from '@/components/PageLayout';

import { Dazahui } from '@/schemas/dazahui';

// export default function SearchPage() {
//   return (
//     <Suspense>
//       <SearchComponent />
//     </Suspense>
//   );
// }

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Dazahui[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://s1.m3u8.io/v1/search?keyword=${keyword}`,
      );
      const json = await res.json();
      setResults(json.data.items);
    } catch (error) {
      console.error(error);
      toast.error('搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout activePath='/search'>
        <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
          <McSearchBar
            handleSearch={handleSearch}
            keyword={keyword}
            setKeyword={setKeyword}
          />
          <div className='grow flex items-center justify-center w-full h-full'>
            <Loader2 className='w-10 h-10 animate-spin' />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/search'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
        <McSearchBar
          handleSearch={handleSearch}
          keyword={keyword}
          setKeyword={setKeyword}
        />
        <div>
          {results.map((result) => (
            <div key={result.id}>{result.title}</div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
