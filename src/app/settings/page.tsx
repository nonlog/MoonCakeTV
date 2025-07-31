import PageLayout from '@/components/PageLayout';
import { LogoutButton } from '@/components/sidebar/logout-button';
import { SettingsButton } from '@/components/sidebar/settings-button';
import { ThemeToggle } from '@/components/sidebar/theme-toggle';

export default function SettingsPage() {
  return (
    <PageLayout activePath='/settings'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
            设置
          </h1>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
            <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6'>
              快捷操作
            </h2>

            {/* Grid layout for buttons - responsive and scalable */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  应用设置
                </h3>
                <SettingsButton />
              </div>

              <div className='flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  主题切换
                </h3>
                <ThemeToggle />
              </div>

              <div className='flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  退出登录
                </h3>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
