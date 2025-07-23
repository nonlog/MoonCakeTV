import { Suspense } from 'react';

import { SearchComponent } from '@/components/search-page';

export default function SearchPage() {
  return (
    <Suspense>
      <SearchComponent />
    </Suspense>
  );
}
