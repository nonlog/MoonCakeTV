"use client";

import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";

import { useGlobalStore } from "@/stores/global";

export default function SignupPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { siteName } = useGlobalStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!username) {
      setError("请输入用户名");
      return;
    }

    if (!password) {
      setError("请输入密码");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.data.success) {
        setError(json.message || "注册失败");
      } else {
        // Success - redirect to login page
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-2 bg-clip-text drop-shadow-xs'>
          {siteName}
        </h1>
        <p className='text-center text-sm text-gray-600 dark:text-gray-400 mb-8'>
          创建新账户
        </p>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label htmlFor='username' className='sr-only'>
              用户名
            </label>
            <input
              id='username'
              type='text'
              autoComplete='username'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-xs ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm'
              placeholder='输入用户名 (至少3个字符)'
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <input
              id='password'
              type='password'
              autoComplete='new-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-xs ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm'
              placeholder='输入密码 (至少6个字符)'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor='confirmPassword' className='sr-only'>
              确认密码
            </label>
            <input
              id='confirmPassword'
              type='password'
              autoComplete='new-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-xs ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm'
              placeholder='再次输入密码'
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }}
            />
          </div>

          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          <button
            type='submit'
            disabled={!username || !password || !confirmPassword || loading}
            className='cursor-pointer inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600'
          >
            {loading ? "注册中..." : "注册"}
          </button>

          <div className='text-center text-sm'>
            <span className='text-gray-600 dark:text-gray-400'>已有账户？</span>{" "}
            <Link
              href='/login'
              className='font-semibold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300'
            >
              立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
