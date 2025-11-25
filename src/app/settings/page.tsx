"use client";

import { Settings } from "lucide-react";

import PageLayout from "@/components/common/page-layout";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SourceConfig } from "@/components/settings/source-config";
import { LogoutButton } from "@/components/sidebar/logout-button";
import { SettingsButton } from "@/components/sidebar/settings-button";

export default function SettingsPage() {
  return (
    <PageLayout activePath='/settings'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
            设置
          </h1>

          {/* Quick settings buttons */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              <SettingsButton>
                <div
                  id='settings-button-container'
                  className='cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                >
                  <Settings className='w-8 h-8' />
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    应用设置
                  </span>
                </div>
              </SettingsButton>

              <div
                onClick={() => {
                  const button = document.querySelector(
                    "#theme-toggle-button",
                  ) as HTMLButtonElement;
                  button?.click();
                }}
                className='cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
              >
                <ThemeToggle />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  主题切换
                </span>
              </div>

              <LogoutButton />
            </div>
          </div>

          {/* Source configuration */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
            <SourceConfig />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
