"use client";

import { useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useUserStore } from "@/stores/user";

export const useAdultModeToggle = () => {
  const { localPassword, adultMode, setAdultMode } = useUserStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleAdultModeToggle = () => {
    // Always show dialog for confirmation
    if (isAdultModeActive()) {
      // For turning off, just show confirmation dialog
      setIsDialogOpen(true);
      return;
    }

    // For turning on, check password first
    if (!localPassword) {
      toast.error("未设置密码", {
        description: "请先在设置页面设置本地密码。",
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
      // Turn on adult mode - password required
      const password = passwordRef.current?.value || "";
      if (password === localPassword) {
        setAdultMode(new Date().toISOString());
        toast.success("成人模式已启用", {
          position: "top-center",
        });
        setIsDialogOpen(false);
        if (passwordRef.current) passwordRef.current.value = "";
      } else {
        toast.error("密码错误");
      }
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    if (passwordRef.current) passwordRef.current.value = "";
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setIsDialogOpen(false);
      if (passwordRef.current) passwordRef.current.value = "";
    }
  };

  const AdultModeDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            <MdOutlineNoAdultContent />
          </DialogTitle>
          <DialogDescription>
            {isAdultModeActive()
              ? "确认关闭成人模式？"
              : "请输入您的本地密码以确认启用成人模式。"}
          </DialogDescription>
        </DialogHeader>
        {!isAdultModeActive() && (
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='password' className='text-right'>
                密码
              </Label>
              <Input
                id='password'
                type='password'
                ref={passwordRef}
                className='col-span-3'
                placeholder='请输入本地密码'
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirm();
                  }
                }}
              />
            </div>
          </div>
        )}
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

  const isAdultModeActive = () => {
    if (!adultMode) return false;
    const adultModeTime = new Date(adultMode).getTime();
    const now = new Date().getTime();
    // Adult mode is active for 24 hours
    return now - adultModeTime < 24 * 60 * 60 * 1000;
  };

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
