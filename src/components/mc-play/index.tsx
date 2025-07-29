import { PageLayout } from '../PageLayout';

export const McPlay = () => {
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
};
