"use client";

import { useState } from "react";
import { MdOutlineNoAdultContent } from "react-icons/md";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useUserStore } from "@/stores/user";

export const useAdultModeToggle = () => {
  const { adultMode, setAdultMode } = useUserStore();

  const isAdultModeActive = () => {
    if (!adultMode) return false;
    const adultModeExpiryTime = new Date(adultMode).getTime();
    const now = new Date().getTime();
    // Check if current time is before the expiry time
    return now < adultModeExpiryTime;
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAdultModeToggle = () => {
    // Always show dialog for confirmation
    if (isAdultModeActive()) {
      // For turning off, just show confirmation dialog
      setIsDialogOpen(true);
      return;
    }

    // For turning on, check password first
    if (!isAdultModeActive()) {
      toast.error("请前往设置页面启用成人模式", {
        action: {
          label: "前往设置",
          onClick: () => {
            const settingsButton = document.querySelector(
              "#settings-button-container",
            ) as HTMLDivElement;
            settingsButton?.click();
          },
        },
      });
      return;
    }

    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (isAdultModeActive()) {
      // Turn off adult mode - no password needed
      setAdultMode("");
      toast.success("成人模式已关闭", {
        position: "top-center",
      });
      setIsDialogOpen(false);
    } else {
      toast.success("成人模式已启用", {
        position: "top-center",
      });
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const AdultModeDialog = () => (
    <Dialog open={isDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MdOutlineNoAdultContent className='text-red-500 text-lg' />
            <span>成人模式</span>
          </DialogTitle>
          <DialogDescription>
            {isAdultModeActive()
              ? "确认关闭成人模式？"
              : "请输入您的本地密码以确认启用成人模式。"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleCancel}
            className='cursor-pointer'
          >
            取消
          </Button>
          <Button onClick={handleConfirm} className='cursor-pointer'>
            {isAdultModeActive() ? "关闭" : "启用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const AdultModeStatus = () => (
    <div className='flex items-center gap-2'>
      <div
        className={`w-2 h-2 rounded-full ${isAdultModeActive() ? "bg-green-500" : "bg-gray-400"}`}
      />
      <span className='text-xs text-gray-500 dark:text-gray-400'>
        {isAdultModeActive() ? "已启用" : "未启用"}
      </span>
    </div>
  );

  return {
    handleAdultModeToggle,
    AdultModeDialog,
    AdultModeStatus,
    isAdultModeActive,
  };
};
