"use client";

import { Database, Loader2, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PLACEHOLDER = `# 每行一个源，格式: 名称 域名
# 例如:
茅台资源 mtzy.tv
极速资源 jisuzy.com`;

export function SourceConfig() {
  const [sourcesText, setSourcesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current sources
  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/caiji/sources");
      const json = await res.json();
      if (json.code === 200) {
        setSourcesText(json.data?.sourcesText || "");
      }
    } catch (error) {
      console.error("Failed to load sources:", error);
      toast.error("加载源配置失败");
    } finally {
      setLoading(false);
    }
  };

  // Save sources
  const saveSources = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/caiji/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcesText }),
      });
      const json = await res.json();
      if (json.code === 200) {
        toast.success("保存成功");
      } else {
        toast.error(json.message || "保存失败");
      }
    } catch (error) {
      console.error("Failed to save sources:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-gray-500' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 mb-2'>
        <Database className='w-5 h-5 text-purple-500' />
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
          视频源配置
        </h3>
      </div>

      <p className='text-sm text-gray-500 dark:text-gray-400'>
        配置采集站 API 源。每行一个，格式为 <code>名称 域名</code>（空格分隔）。
        系统会自动添加 <code>/api.php/provide/vod</code> 后缀。
      </p>

      <Textarea
        value={sourcesText}
        onChange={(e) => setSourcesText(e.target.value)}
        placeholder={DEFAULT_PLACEHOLDER}
        className='min-h-[200px] font-mono text-sm'
      />

      <div className='flex gap-2'>
        <Button
          onClick={saveSources}
          disabled={saving}
          className='bg-purple-600 hover:bg-purple-700'
        >
          {saving ? (
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
          ) : (
            <Save className='w-4 h-4 mr-2' />
          )}
          保存配置
        </Button>

        <Button
          variant='outline'
          onClick={loadSources}
          disabled={loading}
        >
          <RefreshCw className='w-4 h-4 mr-2' />
          重新加载
        </Button>
      </div>

      <div className='text-xs text-gray-400 dark:text-gray-500 space-y-1'>
        <p>提示：</p>
        <ul className='list-disc list-inside space-y-0.5'>
          <li>支持苹果CMS v10 协议的采集站</li>
          <li>可在 <a href='https://www.xn--sss604efuw.com/' target='_blank' rel='noopener noreferrer' className='text-blue-500 hover:underline'>饭太硬</a> 找到源地址</li>
          <li>以 # 开头的行为注释，会被忽略</li>
        </ul>
      </div>
    </div>
  );
}
