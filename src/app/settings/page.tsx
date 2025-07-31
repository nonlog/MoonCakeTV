import PageLayout from '@/components/PageLayout';
import { LogoutButton } from '@/components/sidebar/logout-button';
import { SettingsButton } from '@/components/sidebar/settings-button';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function SettingsPage() {
  return (
    <PageLayout activePath='/settings'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
            设置
          </h1>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
            {/* Simple grid layout for buttons */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'>
                <SettingsButton />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  应用设置
                </span>
              </div>

              <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'>
                <ThemeToggle />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  主题切换
                </span>
              </div>

              <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'>
                <LogoutButton />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  退出登录
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
