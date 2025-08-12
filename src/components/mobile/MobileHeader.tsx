"use client";

import Link from "next/link";

import { useGlobalStore } from "@/stores/global";

import { ThemeToggle } from "../common/theme-toggle";
import { LogoutButton } from "../sidebar/logout-button";

const MobileHeader = () => {
  const { siteName } = useGlobalStore();
  return (
    <header className='md:hidden relative w-full bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-xs dark:bg-gray-900/70 dark:border-gray-700/50'>
      <div className='h-12 flex items-center justify-between px-4 gap-2'>
        <LogoutButton />
        <ThemeToggle />
      </div>

      {/* 中间：Logo（绝对居中） */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
        <Link
          href='/'
          className='text-2xl font-bold text-green-600 tracking-tight hover:opacity-80 transition-opacity'
        >
          {siteName}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
