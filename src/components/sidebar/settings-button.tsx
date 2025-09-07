"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useUserStore } from "@/stores/user";

import { Button } from "../ui/button";

export const SettingsButton = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { setAdultMode } = useUserStore();

  // 重置所有设置为默认值
  const handleResetSettings = () => {
    // 重置所有状态

    setAdultMode(null);

    toast.success("重置为默认设置", {
      position: "top-center",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='w-full max-w-xl'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <DialogTitle className='text-xl font-bold text-gray-800 dark:text-gray-200'>
              我的设置
            </DialogTitle>
            <Button
              onClick={handleResetSettings}
              className='cursor-pointer px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors'
              variant='outline'
              size='sm'
              title='重置为默认设置'
            >
              重置
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
