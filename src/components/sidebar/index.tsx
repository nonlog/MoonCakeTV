'use client';

import { SidebarContent } from '@/components/sidebar/sidebar-content';
import { SidebarProvider } from '@/components/sidebar/sidebar-context';

export const Sidebar = () => {
  return (
    <SidebarProvider>
      <SidebarContent />
    </SidebarProvider>
  );
};
