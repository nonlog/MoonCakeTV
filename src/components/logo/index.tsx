import Link from "next/link";

import { useGlobalStore } from "@/stores/global";

// 可替换为你自己的 logo 图片
export const Logo = () => {
  const { siteName } = useGlobalStore();

  return (
    <Link
      href='/'
      className='flex items-center justify-center h-16 select-none hover:opacity-80 transition-opacity duration-200'
    >
      <span className='text-2xl font-bold text-green-600 tracking-tight'>
        {siteName}
      </span>
    </Link>
  );
};
