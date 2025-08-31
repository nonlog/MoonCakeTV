import { Suspense } from "react";
import { redirect } from "next/navigation";

import SignupForm from "@/components/signup";

async function getServerConfig() {
  const passwordMode = process.env.PASSWORD_MODE?.trim() ?? "local";
  return { PASSWORD_MODE: passwordMode };
}

export default async function SignupPage() {
  const config = await getServerConfig();

  // Only allow signup when PASSWORD_MODE is "db"
  if (config.PASSWORD_MODE !== "db") {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-red-600 dark:text-red-400 mb-4'>
              注册不可用
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mb-6'>
              当前系统配置不支持用户注册。只有在数据库模式下才能注册新用户。
            </p>
            <a
              href='/login'
              className='inline-flex justify-center rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700'
            >
              返回登录
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <Suspense
        fallback={
          <div className='w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
            <div className='animate-pulse'>
              <div className='h-8 bg-gray-300 dark:bg-gray-600 rounded mb-8'></div>
              <div className='space-y-6'>
                <div className='h-12 bg-gray-300 dark:bg-gray-600 rounded'></div>
                <div className='h-12 bg-gray-300 dark:bg-gray-600 rounded'></div>
                <div className='h-12 bg-gray-300 dark:bg-gray-600 rounded'></div>
                <div className='h-12 bg-gray-300 dark:bg-gray-600 rounded'></div>
              </div>
            </div>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
