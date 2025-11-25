"use client";

import { Shield, Users } from "lucide-react";
import Link from "next/link";

import PageLayout from "@/components/common/page-layout";

export default function AdminPage() {
  return (
    <PageLayout activePath='/admin'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center gap-3 mb-8'>
            <Shield className='w-8 h-8 text-purple-600 dark:text-purple-400' />
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              管理后台
            </h1>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            <Link
              href='/admin/users'
              className='block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all'
            >
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
                  <Users className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    用户管理
                  </h2>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    管理用户账户
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
