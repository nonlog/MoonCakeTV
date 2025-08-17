"use client";

import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";

import { useGlobalStore } from "@/stores/global";

type AuthConfig = {
  PASSWORD_MODE: "local" | "env" | "db";
};

export default function LoginPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { siteName } = useGlobalStore();

  const [serverConfig, setServerConfig] = useState<AuthConfig>(
    {} as AuthConfig,
  );
  const shouldAskUsername = serverConfig.PASSWORD_MODE === "db";

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
      })
      .catch((err) => {
        console.error("Server config fetch error:", err);
        setServerConfig({} as AuthConfig);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (serverConfig.PASSWORD_MODE === "env") {
      if (!password) {
        return;
      }
    }

    if (serverConfig.PASSWORD_MODE === "db") {
      if (!username.trim() || !password.trim()) {
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          username,
        }),
      });

      const json = await res.json();

      if (json.data.success) {
        // Use a small delay before redirect for Safari compatibility
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        setError(json.message || "登录失败");
      }
    } catch (err) {
      console.error("Login error:", err);
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
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-8 bg-clip-text drop-shadow-xs'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {shouldAskUsername && (
            <div>
              <label htmlFor='username' className='sr-only'>
                用户名
              </label>
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-xs ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm'
                placeholder='输入用户名'
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.trim());
                }}
              />
            </div>
          )}

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-xs ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm'
              placeholder='输入访问密码'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.trim());
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
            disabled={!password || loading || (shouldAskUsername && !username)}
            className='cursor-pointer inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600'
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
