import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Settings, Upload, File, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
};

interface StockAgentConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface StockAgentProps {
  onClose?: () => void;
}

export default function StockAgent({ onClose }: StockAgentProps) {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 Stock Agent，专业的股票分析助手。我可以帮你分析股票走势、解读技术指标、讨论投资策略等。有什么我可以帮你的吗？',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; url: string }>>([]);
  const [config, setConfig] = useState<StockAgentConfig>(() => {
    const saved = localStorage.getItem('stockAgentConfig');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
      model: 'gpt-5.4-nano',
    };
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callAIMutation = trpc.stock.callAI.useMutation();

  // 监听 localStorage 配置变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('stockAgentConfig');
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse config:', error);
        }
      }
    };

    // 监听 storage 事件（其他标签页或窗口修改）
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（同一标签页内修改）
    window.addEventListener('configUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configUpdated', handleStorageChange);
    };
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          url: url,
        }]);
      };
      reader.readAsDataURL(file);
    });

    // 重置文件输入
    e.currentTarget.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const callStockAgent = async (userMessage: string): Promise<string> => {
    try {
      // 获取最新的配置
      const saved = localStorage.getItem('stockAgentConfig');
      const currentConfig = saved ? JSON.parse(saved) : config;

      const messageContent: any[] = [{ type: 'text', text: userMessage }];

      // 添加附件到消息内容
      attachments.forEach(att => {
        if (att.type.startsWith('image/')) {
          messageContent.push({
            type: 'image_url',
            image_url: { url: att.url },
          });
        } else {
          messageContent.push({
            type: 'text',
            text: `[附件: ${att.name}]`,
          });
        }
      });

      // 通过后端代理调用 AI API，避免 CORS 问题
      const result = await callAIMutation.mutateAsync({
        baseUrl: currentConfig.baseUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的股票分析助手。你可以分析股票走势、解读技术指标、讨论投资策略。请用中文回答，并提供专业的分析建议。如果用户上传了图片，请分析图片内容并提供相关建议。',
          },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: messageContent.length > 1 ? messageContent : userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return result.content || '无法获取回复，请重试。';
    } catch (error) {
      console.error('Stock Agent error:', error);
      return '抱歉，我遇到了一些问题。请检查 API 配置是否正确。';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && attachments.length === 0 || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input || (attachments.length > 0 ? `[已上传 ${attachments.length} 个文件]` : ''),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const assistantReply = await callStockAgent(input || `[已上传 ${attachments.length} 个文件]`);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: assistantReply,
      timestamp: Date.now(),
    }]);

    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border border-border rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-white" />
          <div>
            <h2 className="font-bold text-white">Stock Agent</h2>
            <p className="text-xs text-blue-100">AI 股票分析助手</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation('/ai-config')}
            className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            title="配置 AI"
          >
            <Settings size={18} className="text-white" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-blue-500 rounded transition-colors"
              title="关闭"
            >
              <X size={18} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                'max-w-xs px-4 py-2 rounded-lg',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-secondary text-foreground rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="text-xs opacity-75 flex items-center gap-1">
                      {att.type.startsWith('image/') ? (
                        <Image size={14} />
                      ) : (
                        <File size={14} />
                      )}
                      {att.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground px-4 py-2 rounded-lg rounded-bl-none">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-secondary/50 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">已上传文件:</div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-background px-2 py-1 rounded text-xs"
              >
                {att.type.startsWith('image/') ? (
                  <Image size={12} />
                ) : (
                  <File size={12} />
                )}
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="输入你的问题..."
            disabled={isLoading}
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            title="上传文件"
          >
            <Upload size={16} />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
