/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useUserStore } from "@/stores/user";

export const SettingsButton = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [extendedExpiry, setExtendedExpiry] = useState(false);
  const { setAdultMode } = useUserStore();

  // 重置所有设置为默认值
  const handleResetSettings = () => {
    // 重置所有状态

    setAdultMode(null);
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
            <button
              onClick={handleResetSettings}
              className='px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors'
              title='重置为默认设置'
            >
              重置
            </button>
          </div>
        </DialogHeader>

        {/* 设置项 */}
        <div className='space-y-6'>
          {/* 密码 */}
          <div className='flex flex-col justify-center gap-2'>
            <div className='flex items-center gap-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                验证密码
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                用于验证身份以便于开启🔞成人模式
              </p>
            </div>
            <div></div>
            <label className='flex items-center cursor-pointer w-full'>
              <input
                type='text'
                autoFocus
                placeholder='请输入密码'
                id='adult_mode_password'
                className='w-full'
              />
            </label>

            {/* 30天成人模式选项 */}
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='extended-expiry'
                checked={extendedExpiry}
                onCheckedChange={(checked: boolean) =>
                  setExtendedExpiry(checked === true)
                }
              />
              <label
                htmlFor='extended-expiry'
                className='text-sm text-gray-700 dark:text-gray-300 cursor-pointer'
              >
                启用30天成人模式（默认为24小时）
              </label>
            </div>

            <Button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const adult_mode_password = (
                  document.querySelector(
                    "#adult_mode_password",
                  ) as HTMLInputElement
                )?.value;

                if (!adult_mode_password) {
                  toast.error("请输入密码");
                  return;
                }

                try {
                  const res = await fetch("/api/validate-password", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password: adult_mode_password }),
                  });

                  const json = await res.json();

                  if (json.data.success) {
                    const now = Date.now();
                    // Use 30 days if checkbox is checked, otherwise use 24 hours
                    const durationMs = extendedExpiry
                      ? 1000 * 60 * 60 * 24 * 30 // 30 days
                      : 1000 * 60 * 60 * 24; // 24 hours
                    const ts = new Date(now + durationMs).toISOString();
                    setAdultMode(ts);
                    const successMessage = extendedExpiry
                      ? "成人模式已启用（30天有效期）"
                      : "成人模式已启用（24小时有效期）";
                    toast.success(successMessage);
                  } else {
                    toast.error(json.message || "密码验证失败");
                  }
                } catch (err) {
                  toast.error("密码验证失败，请稍后重试");
                }
              }}
              size='lg'
              className='w-fit'
            >
              验证
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
