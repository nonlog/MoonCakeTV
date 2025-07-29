'use client';

import { Calendar, Globe, Loader2, Play } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import McSearchBar from '@/components/mc-search/search-bar';
import PageLayout from '@/components/PageLayout';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Dazahui } from '@/schemas/dazahui';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Dazahui[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchKeyword?: string) => {
    const searchTerm = searchKeyword || keyword;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `https://s1.m3u8.io/v1/search?keyword=${encodeURIComponent(searchTerm)}`,
      );
      const json = await res.json();
      setResults(json.data.items);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      toast.error('搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize keyword from URL params and trigger search if present
  useEffect(() => {
    const urlKeyword = searchParams.get('keyword') || '';
    if (urlKeyword) {
      setKeyword(urlKeyword);
      handleSearch(urlKeyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateUrlParams = (newKeyword: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newKeyword.trim()) {
      params.set('keyword', newKeyword.trim());
    } else {
      params.delete('keyword');
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleKeywordChange = (v: string) => {
    setKeyword(v);
    updateUrlParams(v);
  };

  if (isLoading) {
    return (
      <PageLayout activePath='/search'>
        <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
          <McSearchBar
            handleSearch={handleSearch}
            keyword={keyword}
            handleKeywordChange={handleKeywordChange}
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
          handleKeywordChange={handleKeywordChange}
        />
        {!hasSearched ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
              <Play className='w-8 h-8 text-slate-400' />
            </div>
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              开始搜索内容
            </h3>
            <p className='text-slate-500 max-w-sm'>
              在上方输入关键词并按回车键开始搜索
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
              <Play className='w-8 h-8 text-slate-400' />
            </div>
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              没有找到相关内容
            </h3>
            <p className='text-slate-500 max-w-sm'>
              尝试使用不同的关键词或检查拼写是否正确
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {results.map((result) => (
              <Card
                key={result.id}
                className='group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden'
              >
                <div className='relative'>
                  {result.cover_image ? (
                    <div className='aspect-[3/4] overflow-hidden'>
                      <img
                        key={result.mc_id}
                        src={result.cover_image}
                        alt={result.title}
                        loading='lazy'
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden',
                          );
                        }}
                      />
                      <div className='hidden aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 justify-center items-center'>
                        <Play className='w-12 h-12 text-slate-400' />
                      </div>
                    </div>
                  ) : (
                    <div className='aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
                      <Play className='w-12 h-12 text-slate-400' />
                    </div>
                  )}
                  <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100'>
                    <Play className='w-8 h-8 text-white' />
                  </div>
                </div>

                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium line-clamp-2 leading-tight'>
                    {result.title}
                  </CardTitle>
                  {result.summary && (
                    <CardDescription className='text-xs line-clamp-2'>
                      {result.summary}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className='pt-0 space-y-2'>
                  <div className='flex flex-wrap gap-1'>
                    {result.category && (
                      <Badge
                        variant='secondary'
                        className='text-xs px-2 py-0.5'
                      >
                        {result.category}
                      </Badge>
                    )}
                    {result.language && (
                      <Badge variant='outline' className='text-xs px-2 py-0.5'>
                        <Globe className='w-3 h-3 mr-1' />
                        {result.language}
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    {result.year && (
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        <span>{result.year}</span>
                      </div>
                    )}
                    {result.region && (
                      <span className='truncate'>{result.region}</span>
                    )}
                  </div>

                  {result.casting && result.casting.length > 0 && (
                    <div className='text-xs text-muted-foreground'>
                      <span className='font-medium'>演员: </span>
                      <span className='line-clamp-1'>{result.casting}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
