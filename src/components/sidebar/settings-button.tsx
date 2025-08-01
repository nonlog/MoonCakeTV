/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  const { localPassword, setLocalPassword } = useUserStore();

  const [doubanProxyUrl, setDoubanProxyUrl] = useState("");
  const [imageProxyUrl, setImageProxyUrl] = useState("");

  const [enableImageProxy, setEnableImageProxy] = useState(false);

  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDoubanProxyUrl = localStorage.getItem("doubanProxyUrl");
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl);
      }

      const savedEnableImageProxy = localStorage.getItem("enableImageProxy");
      const defaultImageProxy =
        (window as any).RUNTIME_CONFIG?.IMAGE_PROXY || "";
      if (savedEnableImageProxy !== null) {
        setEnableImageProxy(JSON.parse(savedEnableImageProxy));
      } else if (defaultImageProxy) {
        // 如果有默认图片代理配置，则默认开启
        setEnableImageProxy(true);
      }

      const savedImageProxyUrl = localStorage.getItem("imageProxyUrl");
      if (savedImageProxyUrl !== null) {
        setImageProxyUrl(savedImageProxyUrl);
      } else if (defaultImageProxy) {
        setImageProxyUrl(defaultImageProxy);
      }
    }
  }, []);

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("doubanProxyUrl", value);
    }
  };

  const handleImageProxyUrlChange = (value: string) => {
    setImageProxyUrl(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("imageProxyUrl", value);
    }
  };

  const handleImageProxyToggle = (value: boolean) => {
    setEnableImageProxy(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("enableImageProxy", JSON.stringify(value));
    }
  };

  // 重置所有设置为默认值
  const handleResetSettings = () => {
    const defaultImageProxy = (window as any).RUNTIME_CONFIG?.IMAGE_PROXY || "";

    // 重置所有状态

    setLocalPassword();
    setDoubanProxyUrl("");
    setEnableImageProxy(!!defaultImageProxy);
    setImageProxyUrl(defaultImageProxy);

    // 保存到 localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("defaultAggregateSearch", JSON.stringify(true));
      localStorage.setItem("enableOptimization", JSON.stringify(true));
      localStorage.setItem("doubanProxyUrl", "");
      localStorage.setItem(
        "enableImageProxy",
        JSON.stringify(!!defaultImageProxy),
      );
      localStorage.setItem("imageProxyUrl", defaultImageProxy);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='w-full max-w-xl'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <DialogTitle className='text-xl font-bold text-gray-800 dark:text-gray-200'>
              本地设置
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
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                设置密码
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                本地保存，没有加密的明文密码
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <input
                type='text'
                autoFocus
                placeholder={localPassword}
                id='local_password'
              />
            </label>
            <Button
              onClick={() => {
                const password = (
                  document.querySelector("#local_password") as HTMLInputElement
                )?.value;
                setLocalPassword(password);
                toast.success("密码保存成功");
              }}
            >
              保存
            </Button>
          </div>

          {/* 豆瓣代理设置 */}
          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                豆瓣数据代理
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                设置代理URL以绕过豆瓣访问限制，留空则使用服务端API
              </p>
            </div>
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={doubanProxyUrl}
              onChange={(e) => handleDoubanProxyUrlChange(e.target.value)}
            />
          </div>

          {/* 图片代理开关 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                启用图片代理
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                启用后，所有图片加载将通过代理服务器
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={enableImageProxy}
                  onChange={(e) => handleImageProxyToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 图片代理地址设置 */}
          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                图片代理地址
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                仅在启用图片代理时生效
              </p>
            </div>
            <input
              type='text'
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                enableImageProxy
                  ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed"
              }`}
              placeholder='例如: https://imageproxy.example.com/?url='
              value={imageProxyUrl}
              onChange={(e) => handleImageProxyUrlChange(e.target.value)}
              disabled={!enableImageProxy}
            />
          </div>
        </div>

        {/* 底部说明 */}
        <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
            这些设置保存在本地浏览器中
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
