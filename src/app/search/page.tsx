"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { SearchPage as SearchPageComponent } from "src/components/search-page";

import PageLayout from "@/components/common/page-layout";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <PageLayout activePath='/search'>
          <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
            <div className='grow flex items-center justify-center w-full h-full'>
              <Loader2 className='w-10 h-10 animate-spin' />
            </div>
          </div>
        </PageLayout>
      }
    >
      <SearchPageComponent />
    </Suspense>
  );
}
