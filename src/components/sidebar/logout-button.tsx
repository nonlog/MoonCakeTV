"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const LogoutButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const performLogout = async () => {
    setLoading(true);
    toast.loading("正在注销...", { id: "logout" });

    try {
      // 调用注销API来清除cookie
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      toast.success("注销成功", { id: "logout" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      console.error("注销请求失败:", error);
      toast.error("注销失败，请重试", { id: "logout" });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (loading) return;

    toast("确定要注销吗？", {
      id: "logout-confirm",
      action: {
        label: "确定",
        onClick: () => {
          toast.dismiss("logout-confirm");
          performLogout();
        },
      },
      cancel: {
        label: "取消",
        onClick: () => {
          toast.dismiss("logout-confirm");
        },
      },
      duration: 5000,
      position: "top-center",
    });
  };

  return (
    <div
      onClick={handleLogout}
      className='cursor-pointer flex items-center gap-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
    >
      <button
        className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
        aria-label='Logout'
      >
        <LogOut className='w-full h-full' />
      </button>
      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
        退出登录
      </span>
    </div>
  );
};
