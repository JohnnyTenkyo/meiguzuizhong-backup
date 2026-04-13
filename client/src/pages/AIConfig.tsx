import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, RotateCcw, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';

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

const CORRECT_PASSCODE = '940531';

export default function AIConfig() {
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'reset' | null>(null);
  const [isConfigInitialized, setIsConfigInitialized] = useState(false);
  
  const testConnectionMutation = trpc.stock.testConnection.useMutation();

  useEffect(() => {
    // 从 localStorage 加载配置
    const saved = localStorage.getItem('stockAgentConfig');
    const hasSeenPasscode = localStorage.getItem('stockAgentPasscodeVerified');
    
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
    
    setIsConfigInitialized(true);
  }, []);

  const handleSaveClick = () => {
    // 如果是首次保存（没有验证过），直接保存
    const hasVerified = localStorage.getItem('stockAgentPasscodeVerified');
    if (!hasVerified) {
      handleSaveWithPasscode();
    } else {
      // 已经验证过，再次修改需要输入验证码
      setPendingAction('save');
      setShowPasscodeDialog(true);
      setPasscode('');
      setPasscodeError('');
    }
  };

  const handleResetClick = () => {
    const hasVerified = localStorage.getItem('stockAgentPasscodeVerified');
    if (!hasVerified) {
      handleResetWithoutPasscode();
    } else {
      setPendingAction('reset');
      setShowPasscodeDialog(true);
      setPasscode('');
      setPasscodeError('');
    }
  };

  const handlePasscodeSubmit = () => {
    if (passcode === CORRECT_PASSCODE) {
      setShowPasscodeDialog(false);
      setPasscodeError('');
      
      if (pendingAction === 'save') {
        handleSaveWithPasscode();
      } else if (pendingAction === 'reset') {
        handleResetWithoutPasscode();
      }
      
      setPendingAction(null);
    } else {
      setPasscodeError('验证码错误，请重试');
    }
  };

  const handleSaveWithPasscode = async () => {
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
      localStorage.setItem('stockAgentPasscodeVerified', 'true');
      
      // 触发自定义事件以通知 Stock Agent 组件
      window.dispatchEvent(new Event('configUpdated'));
      
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

  const handleResetWithoutPasscode = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.setItem('stockAgentConfig', JSON.stringify(DEFAULT_CONFIG));
    localStorage.setItem('stockAgentPasscodeVerified', 'true');
    window.dispatchEvent(new Event('configUpdated'));
    setSaveStatus('success');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const handleTest = async () => {
    // 验证配置
    if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.model.trim()) {
      setTestStatus('error');
      setTestMessage('请先填写所有配置项');
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 3000);
      return;
    }

    setIsTesting(true);
    setTestStatus('testing');
    setTestMessage('正在测试连接...');

    try {
      // 使用 tRPC 客户端调用 testConnection
      const result = await testConnectionMutation.mutateAsync({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      });

      if (result.success) {
        setTestStatus('success');
        setTestMessage('✓ AI 连接成功！配置正确。');
      } else {
        setTestStatus('error');
        setTestMessage(`✗ 连接失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`✗ 测试失败: ${error instanceof Error ? error.message : '网络错误'}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 4000);
    }
  };

  if (!isConfigInitialized) {
    return null;
  }

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

            {/* Test Status Message */}
            {testStatus === 'success' && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-700 dark:text-green-400">
                {testMessage}
              </div>
            )}
            {testStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-700 dark:text-red-400">
                {testMessage}
              </div>
            )}
            {testStatus === 'testing' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <div className="animate-spin">⏳</div>
                {testMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
              <Button
                onClick={handleTest}
                disabled={isTesting}
                variant="secondary"
                className="flex-1"
              >
                <Zap size={16} className="mr-2" />
                {isTesting ? '测试中...' : '测试连接'}
              </Button>
              <Button
                onClick={handleResetClick}
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
                <li>• 首次保存配置时需要输入验证码</li>
                <li>• 之后修改配置时每次都需要输入验证码进行认证</li>
                <li>• 配置更改后，Stock Agent 会立即使用新的参数</li>
                <li>• API Key 存储在浏览器本地，不会上传到服务器</li>
                <li>• 点击"测试连接"验证 API 配置是否正确</li>
                <li>• 如果遇到连接问题，请检查 Base URL 和 API Key 是否正确</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passcode Dialog */}
      <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={20} />
              安全认证
            </DialogTitle>
            <DialogDescription>
              为了保护您的配置安全，请输入验证码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">验证码</label>
              <Input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasscodeSubmit();
                  }
                }}
                placeholder="输入验证码"
                className="text-center text-lg tracking-widest"
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs text-red-600 dark:text-red-400">{passcodeError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPasscodeDialog(false)}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handlePasscodeSubmit}
                className="flex-1"
              >
                确认
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
