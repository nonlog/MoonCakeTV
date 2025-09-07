"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MdOutlineNoAdultContent } from "react-icons/md";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useUserStore } from "@/stores/user";

export const useAdultModeToggle = () => {
  const { adultMode, setAdultMode } = useUserStore();
  const [serverConfig, setServerConfig] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const extendedExpiryRef = useRef(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isLocal = useMemo(() => {
    return serverConfig?.PASSWORD_MODE === "local";
  }, [serverConfig?.PASSWORD_MODE]);

  useEffect(() => {
    fetch("/api/server-config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        setServerConfig(json.data);
      });
  }, []);

  // Focus the password input when dialog opens and it's not local mode
  useEffect(() => {
    if (isDialogOpen && !isLocal && passwordInputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isDialogOpen, isLocal]);

  const isAdultModeActive = useCallback(() => {
    if (!adultMode) return false;
    const adultModeExpiryTime = new Date(adultMode).getTime();
    const now = new Date().getTime();
    // Check if current time is before the expiry time
    return now < adultModeExpiryTime;
  }, [adultMode]);

  const handleAdultModeToggle = async () => {
    // Always show dialog for confirmation
    if (isAdultModeActive()) {
      // For turning off, just show confirmation dialog
      setIsDialogOpen(true);
      return;
    }

    // Always show dialog for enabling adult mode

    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (isAdultModeActive()) {
      // Turn off adult mode - no password needed
      setAdultMode("");
      toast.success("成人模式已关闭", {
        position: "top-center",
      });
      setIsDialogOpen(false);
      return;
    }

    // For enabling adult mode
    if (isLocal) {
      // Local mode - no password validation needed
      const now = Date.now();
      const durationMs = extendedExpiryRef.current
        ? 1000 * 60 * 60 * 24 * 30 // 30 days
        : 1000 * 60 * 60 * 24; // 24 hours
      const ts = new Date(now + durationMs).toISOString();
      setAdultMode(ts);
      const successMessage = extendedExpiryRef.current
        ? "成人模式已启用（30天有效期）"
        : "成人模式已启用（24小时有效期）";
      toast.success(successMessage, {
        position: "top-center",
      });
      setIsDialogOpen(false);
    } else {
      // Non-local mode - validate password
      if (!passwordInputRef.current?.value.trim()) {
        toast.error("请输入密码");
        return;
      }

      try {
        const res = await fetch("/api/validate-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: passwordInputRef.current?.value.trim(),
          }),
        });

        const json = await res.json();

        if (json.data.success) {
          const now = Date.now();
          const durationMs = extendedExpiryRef.current
            ? 1000 * 60 * 60 * 24 * 30 // 30 days
            : 1000 * 60 * 60 * 24; // 24 hours
          const ts = new Date(now + durationMs).toISOString();
          setAdultMode(ts);
          const successMessage = extendedExpiryRef.current
            ? "成人模式已启用（30天有效期）"
            : "成人模式已启用（24小时有效期）";
          toast.success(successMessage, {
            position: "top-center",
          });
          setIsDialogOpen(false);
          if (passwordInputRef.current) {
            passwordInputRef.current.value = ""; // Clear password
          }
        } else {
          toast.error(json.message || "密码验证失败");
        }
      } catch {
        toast.error("密码验证失败，请稍后重试");
      }
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    if (passwordInputRef.current) {
      passwordInputRef.current.value = ""; // Clear password when canceling
    }

    extendedExpiryRef.current = false;
  };

  const AdultModeDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MdOutlineNoAdultContent className='text-red-500 text-lg h-10 w-10' />
            <span>
              成人模式（现在没有成人内容，打开了也没有内容，抱歉，正在努力中）
            </span>
          </DialogTitle>
          <DialogDescription>
            {isAdultModeActive()
              ? "确认关闭成人模式？"
              : isLocal
                ? "确认启用成人模式？"
                : "请输入密码以确认启用成人模式。"}
          </DialogDescription>
        </DialogHeader>

        {/* Password input and options for enabling adult mode */}
        {!isAdultModeActive() && (
          <div className='space-y-4'>
            {/* Password input for non-local mode */}
            {!isLocal && (
              <div className='space-y-2'>
                <label
                  htmlFor='adult-mode-password'
                  className='text-sm font-medium text-gray-700 dark:text-gray-300'
                >
                  验证密码
                </label>
                <Input
                  id='adult-mode-password'
                  type='password'
                  placeholder='请输入密码'
                  ref={passwordInputRef}
                  autoFocus
                />
              </div>
            )}

            {/* Duration options */}
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='extended-expiry'
                onCheckedChange={(checked: boolean) => {
                  extendedExpiryRef.current = checked;
                }}
              />
              <label
                htmlFor='extended-expiry'
                className='text-sm text-gray-700 dark:text-gray-300 cursor-pointer'
              >
                启用30天成人模式（默认为24小时）
              </label>
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

  const AdultModeStatus = () => {
    const isActive = isAdultModeActive();
    return (
      <div className='flex items-center gap-2'>
        <div
          className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}
        />
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          {isActive ? "已启用" : "未启用"}
        </span>
      </div>
    );
  };

  return {
    handleAdultModeToggle,
    AdultModeDialog,
    AdultModeStatus,
    isAdultModeActive,
  };
};
