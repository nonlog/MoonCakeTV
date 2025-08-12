import MobileBottomNav from "../mobile/MobileBottomNav";
import MobileHeader from "../mobile/MobileHeader";
import { Sidebar } from "../sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export const PageLayout = ({ children, activePath = "/" }: PageLayoutProps) => {
  return (
    <div className='w-full min-h-screen'>
      {/* 移动端头部 */}
      <MobileHeader />

      {/* 主要布局容器 */}
      <div className='flex md:grid md:grid-cols-[auto_1fr] w-full min-h-screen md:min-h-auto'>
        {/* 侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className='hidden md:block'>
          <Sidebar />
        </div>

        {/* 主内容区域 */}
        <div className='relative min-w-0 flex-1 transition-all duration-300'>
          {/* 主内容 */}
          <main className='flex-1 md:min-h-0 h-screen'>{children}</main>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className='md:hidden'>
        <MobileBottomNav activePath={activePath} />
      </div>
    </div>
  );
};

export default PageLayout;
