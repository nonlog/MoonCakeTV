import Link from "next/link";
import { FaGithub } from "react-icons/fa6";

import { useGlobalStore } from "@/stores/global";

// 可替换为你自己的 logo 图片
export const Logo = () => {
  const { siteName } = useGlobalStore();

  return (
    <div className='flex items-center justify-center gap-3 h-16 select-none hover:opacity-80 transition-opacity duration-200'>
      <Link
        href='/'
        className='text-2xl font-bold text-green-600 tracking-tight'
      >
        {siteName}
      </Link>
      <Link href='https://github.com/mooncaketv/mooncaketv' target='_blank'>
        <FaGithub className='w-6 h-6' />
      </Link>
    </div>
  );
};
