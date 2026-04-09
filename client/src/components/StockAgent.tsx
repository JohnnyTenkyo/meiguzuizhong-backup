import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

interface StockAgentConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export default function StockAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 Stock Agent，专业的股票分析助手。我可以帮你分析股票走势、解读技术指标、讨论投资策略等。有什么我可以帮你的吗？',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<StockAgentConfig>(() => {
    const saved = localStorage.getItem('stockAgentConfig');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
      model: 'gpt-5.4-nano',
    };
  });
  const [tempConfig, setTempConfig] = useState(config);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const callStockAgent = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的股票分析助手。你可以分析股票走势、解读技术指标、讨论投资策略。请用中文回答，并提供专业的分析建议。',
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '无法获取回复，请重试。';
    } catch (error) {
      console.error('Stock Agent error:', error);
      return '抱歉，我遇到了一些问题。请检查 API 配置是否正确。';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callStockAgent(input);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setConfig(tempConfig);
    localStorage.setItem('stockAgentConfig', JSON.stringify(tempConfig));
    setShowSettings(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40"
        title="Stock Agent"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Stock Agent</div>
            <div className="text-xs text-muted-foreground">专业股票分析助手</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="/ai-config"
            className="p-1.5 hover:bg-secondary rounded-md transition-colors inline-block"
            title="AI 配置页面"
          >
            <Settings size={18} />
          </a>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
            title="快速设置"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
          <div>
            <label className="text-xs font-medium">Base URL</label>
            <select
              value={tempConfig.baseUrl}
              onChange={(e) => setTempConfig({ ...tempConfig, baseUrl: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background"
            >
              <option value="https://yunwu.ai">https://yunwu.ai</option>
              <option value="https://yunwu.ai/v1">https://yunwu.ai/v1</option>
              <option value="https://yunwu.ai/v1/chat/completions">https://yunwu.ai/v1/chat/completions</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">API Key</label>
            <Input
              type="password"
              value={tempConfig.apiKey}
              onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
              className="mt-1 h-8 text-xs"
              placeholder="输入 API Key"
            />
          </div>
          <div>
            <label className="text-xs font-medium">模型</label>
            <Input
              value={tempConfig.model}
              onChange={(e) => setTempConfig({ ...tempConfig, model: e.target.value })}
              className="mt-1 h-8 text-xs"
              placeholder="输入模型名称"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveConfig}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              保存配置
            </Button>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-xs px-3 py-2 rounded-lg text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">思考中...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="输入问题..."
          className="h-9 text-sm"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          size="sm"
          className="px-3 h-9"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
