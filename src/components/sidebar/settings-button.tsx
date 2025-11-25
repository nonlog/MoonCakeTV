"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useGlobalStore } from "@/stores/global";

export const SettingsButton = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { displayDouban, setDisplayDouban } = useGlobalStore();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='w-full max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-gray-800 dark:text-gray-200'>
            我的设置
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-2'>
            <Label htmlFor='displayDouban'>显示豆瓣热门和电视剧</Label>
            <Switch
              id='displayDouban'
              checked={displayDouban}
              onCheckedChange={setDisplayDouban}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
