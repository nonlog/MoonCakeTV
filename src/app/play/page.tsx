'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import { Loader2 } from 'lucide-react';

export default function McPlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const mc_id = searchParams.get('mc_id');

  useEffect(() => {
    if (mc_id?.trim()) {
      setLoading(true);
      fetch(`https://s1.m3u8.io/v1/mc_item/${mc_id}`)
        .then((res) => res.json())
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      router.push('/');
    }
  }, [mc_id]); // eslint-disable-line

  if (!mc_id) {
    return null;
  }

  if (loading) {
    return (
      <PageLayout activePath='/play'>
        <div className='w-full h-full flex items-center justify-center'>
          <Loader2 className='w-8 h-8 animate-spin' />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Main Content
          </h2>
          <p className='text-gray-600'>
            This is the main content area of the page. Add your content here.
          </p>
        </div>
      </main>
    </PageLayout>
  );
}
