"use client";

import { Shield } from "lucide-react";
import Link from "next/link";

import PageLayout from "@/components/common/page-layout";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SourceConfig } from "@/components/settings/source-config";
import { LogoutButton } from "@/components/sidebar/logout-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useGlobalStore } from "@/stores/global";

export default function SettingsPage() {
  const { displayDouban, setDisplayDouban } = useGlobalStore();

  return (
    <PageLayout activePath='/settings'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
            设置
          </h1>

          {/* Quick settings buttons */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              快捷操作
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
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

              <Link
                href='/admin'
                className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
              >
                <Shield className='w-8 h-8 text-purple-600 dark:text-purple-400' />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  管理后台
                </span>
              </Link>
            </div>
          </div>

          {/* Display settings */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              显示设置
            </h2>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between gap-2'>
                <Label
                  htmlFor='displayDouban'
                  className='text-gray-700 dark:text-gray-300'
                >
                  显示豆瓣热门和电视剧
                </Label>
                <Switch
                  id='displayDouban'
                  checked={displayDouban}
                  onCheckedChange={setDisplayDouban}
                />
              </div>
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
