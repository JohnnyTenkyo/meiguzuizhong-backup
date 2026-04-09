import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_CONFIG: AIConfig = {
  baseUrl: 'https://yunwu.ai/v1',
  apiKey: 'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
  model: 'gpt-5.4-nano',
};

export default function AIConfig() {
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // 从 localStorage 加载配置
    const saved = localStorage.getItem('stockAgentConfig');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 验证配置
      if (!config.baseUrl.trim()) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }
      if (!config.apiKey.trim()) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }
      if (!config.model.trim()) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }

      // 保存到 localStorage
      localStorage.setItem('stockAgentConfig', JSON.stringify(config));
      setSaveStatus('success');

      // 2秒后重置状态
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.setItem('stockAgentConfig', JSON.stringify(DEFAULT_CONFIG));
    setSaveStatus('success');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-1.5 hover:bg-secondary rounded-md transition-colors"
              title="返回首页"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">AI 配置</h1>
              <p className="text-xs text-muted-foreground">配置 Stock Agent 的 API 参数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Stock Agent 配置</CardTitle>
            <CardDescription>
              配置 Stock Agent 使用的 AI 服务参数。这些设置将应用到所有 Stock Agent 对话中。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">API Base URL</label>
              <Input
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="例如: https://yunwu.ai/v1"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                yunwu.ai API 的访问端点
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="输入你的 API Key"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                你的 yunwu.ai API 密钥，用于身份验证
              </p>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">模型名称</label>
              <Input
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="例如: gpt-5.4-nano"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                使用的 AI 模型名称
              </p>
            </div>

            {/* Status Message */}
            {saveStatus === 'success' && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-700 dark:text-green-400">
                ✓ 配置已保存成功
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-700 dark:text-red-400">
                ✗ 保存失败，请检查输入
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw size={16} className="mr-2" />
                恢复默认
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md space-y-2">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                💡 提示
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>• 配置更改后，Stock Agent 会立即使用新的参数</li>
                <li>• API Key 存储在浏览器本地，不会上传到服务器</li>
                <li>• 如果遇到连接问题，请检查 Base URL 和 API Key 是否正确</li>
                <li>• 不同的模型可能有不同的性能和成本</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
