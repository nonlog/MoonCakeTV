import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import { McPlay } from '@/components/mc-play';
import PageLayout from '@/components/PageLayout';

interface McPlayPageProps {
  searchParams: Promise<{ mc_id: string | string[] | undefined }>;
}

export default async function McPlayPage({ searchParams }: McPlayPageProps) {
  const _searchParams = await searchParams;
  const mc_id = _searchParams.mc_id as string;

  if (!mc_id?.trim()) {
    redirect('/');
  }

  const res = await fetch(`https://s1.m3u8.io/v1/mc_item/${mc_id}`);
  const json = await res.json();

  console.log(json);

  return (
    <Suspense
      fallback={
        <PageLayout activePath='/play'>
          <div className='w-full h-full flex items-center justify-center'>
            <Loader2 className='w-8 h-8 animate-spin' />
          </div>
        </PageLayout>
      }
    >
      <McPlay />
    </Suspense>
  );
}
