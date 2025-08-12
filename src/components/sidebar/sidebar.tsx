"use client";

import { Bookmark, Clock, Home, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGear } from "react-icons/fa6";

import { cn } from "@/lib/utils";

import { Logo } from "@/components/logo";

import { useSidebarStore } from "@/stores/sidebar";

export const Sidebar = () => {
  const { expanded, toggleSidebar } = useSidebarStore();
  const pathname = usePathname();

  return (
    <div className='hidden md:flex'>
      <aside
        data-sidebar
        className={cn(
          "fixed top-0 left-0 h-screen bg-white/40 backdrop-blur-xl transition-all duration-300 border-r border-gray-200/50 z-10 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/50",
          expanded ? "w-64" : "w-16",
        )}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className='flex h-full flex-col'>
          {/* 顶部 Logo 区域 */}
          <div className='relative h-16'>
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                expanded ? "opacity-100" : "opacity-0",
              )}
            >
              <div className='w-[calc(100%-4rem)] flex justify-center'>
                {expanded && <Logo />}
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={cn(
                "cursor-pointer",
                "absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors duration-200 z-10 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50",
                expanded ? "right-2" : "left-1/2 -translate-x-1/2",
              )}
            >
              <Menu className='h-4 w-4' />
            </button>
          </div>

          {/* 首页和搜索导航 */}
          <nav className='px-2 mt-4 space-y-1'>
            <Link
              href='/'
              data-active={pathname === "/"}
              className={cn(
                "group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 gap-3 justify-start",
                expanded ? "mx-0" : "w-full max-w-none mx-0",
              )}
            >
              <div className='w-4 h-4 flex items-center justify-center'>
                <Home className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
              </div>
              {expanded && (
                <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                  首页
                </span>
              )}
            </Link>
            <Link
              href='/search'
              data-active={pathname === "/search"}
              className={cn(
                "group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 gap-3 justify-start",
                expanded ? "mx-0" : "w-full max-w-none mx-0",
              )}
            >
              <div className='w-4 h-4 flex items-center justify-center'>
                <Search className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
              </div>
              {expanded && (
                <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                  搜索
                </span>
              )}
            </Link>
            <Link
              href='/bookmarks'
              data-active={pathname === "/bookmarks"}
              className={cn(
                "group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 gap-3 justify-start",
                expanded ? "mx-0" : "w-full max-w-none mx-0",
              )}
            >
              <div className='w-4 h-4 flex items-center justify-center'>
                <Bookmark className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
              </div>
              {expanded && (
                <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                  收藏夹
                </span>
              )}
            </Link>
            <Link
              href='/watch-history'
              data-active={pathname === "/watch-history"}
              className={cn(
                "group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 gap-3 justify-start",
                expanded ? "mx-0" : "w-full max-w-none mx-0",
              )}
            >
              <div className='w-4 h-4 flex items-center justify-center'>
                <Clock className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
              </div>
              {expanded && (
                <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                  历史记录
                </span>
              )}
            </Link>
            <Link
              href='/settings'
              data-active={pathname === "/settings"}
              className={cn(
                "group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 gap-3 justify-start",
                expanded ? "mx-0" : "w-full max-w-none mx-0",
              )}
            >
              <div className='w-4 h-4 flex items-center justify-center'>
                <FaGear className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
              </div>
              {expanded && (
                <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                  设置
                </span>
              )}
            </Link>
          </nav>
        </div>
      </aside>
      <div
        className={cn(
          "transition-all duration-300 sidebar-offset",
          expanded ? "w-64" : "w-16",
        )}
      ></div>
    </div>
  );
};
