'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Settings, Upload, File, Image, Plus, Trash2 } from 'lucide-react';
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

interface ConversationThread {
  id: number;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface StockAgentProps {
  onClose?: () => void;
}

export default function StockAgent({ onClose }: StockAgentProps) {
  const [, setLocation] = useLocation();
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
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
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC 调用
  const createConversationMutation = trpc.stock.createConversation.useMutation();
  const getConversationsMutation = trpc.stock.getConversations.useQuery({ agentType: "stock" });
  const getMessagesMutation = trpc.stock.getMessages.useMutation();
  const saveMessageMutation = trpc.stock.saveMessage.useMutation();
  const deleteConversationMutation = trpc.stock.deleteConversation.useMutation();
  const callAIMutation = trpc.stock.callAI.useMutation();

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 监听配置更新
  useEffect(() => {
    const handleConfigUpdate = () => {
      const saved = localStorage.getItem('stockAgentConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    };

    window.addEventListener('stockAgentConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('stockAgentConfigUpdated', handleConfigUpdate);
  }, []);

  const loadConversations = async () => {
    try {
      const result = await getConversationsMutation.mutateAsync();
      setConversations(result);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const result = await createConversationMutation.mutateAsync({
        title: `对话 ${new Date().toLocaleString()}`,
        assistantType: 'stock_agent',
      });
      setCurrentThreadId(result.id);
      setMessages([
        {
          role: 'assistant',
          content: '你好！我是 Stock Agent，专业的股票分析助手。我可以帮你分析股票走势、解读技术指标、讨论投资策略等。有什么我可以帮你的吗？',
          timestamp: Date.now(),
        },
      ]);
      await loadConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const switchConversation = async (threadId: number) => {
    try {
      setCurrentThreadId(threadId);
      const result = await getMessagesMutation.mutateAsync({ threadId });
      setMessages(result.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const deleteConversation = async (threadId: number) => {
    try {
      await deleteConversationMutation.mutateAsync({ threadId });
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
        setMessages([
          {
            role: 'assistant',
            content: '你好！我是 Stock Agent，专业的股票分析助手。我可以帮你分析股票走势、解读技术指标、讨论投资策略等。有什么我可以帮你的吗？',
            timestamp: Date.now(),
          },
        ]);
      }
      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const attachment = {
          name: file.name,
          type: file.type,
          url: base64,
        };
        setAttachments(prev => [...prev, attachment]);
      };

      reader.readAsDataURL(file);
    }

    e.currentTarget.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const callStockAgent = async (userMessage: string): Promise<string> => {
    try {
      const saved = localStorage.getItem('stockAgentConfig');
      const currentConfig = saved ? JSON.parse(saved) : config;

      const messageContent: any[] = [{ type: 'text', text: userMessage }];

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

      // 通过后端代理调用 AI API，并自动查询股票数据
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
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // 如果没有对话线程，创建新的
    if (!currentThreadId) {
      await createNewConversation();
    }

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

    // 保存用户消息到数据库
    if (currentThreadId) {
      try {
        await saveMessageMutation.mutateAsync({
          threadId: currentThreadId,
          role: 'user',
          content: userMessage.content,
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

    const assistantReply = await callStockAgent(input || `[已上传 ${attachments.length} 个文件]`);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantReply,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    // 保存 AI 回复到数据库
    if (currentThreadId) {
      try {
        await saveMessageMutation.mutateAsync({
          threadId: currentThreadId,
          role: 'assistant',
          content: assistantReply,
        });
      } catch (error) {
        console.error('Failed to save assistant message:', error);
      }
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* 对话历史侧边栏 */}
      {showSidebar && (
        <div className="w-64 border-r border-border bg-muted/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              onClick={createNewConversation}
              className="w-full gap-2"
              variant="default"
            >
              <Plus className="w-4 h-4" />
              新建对话
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  'p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors group',
                  currentThreadId === conv.id && 'bg-muted'
                )}
              >
                <div
                  onClick={() => switchConversation(conv.id)}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="border-b border-border bg-background p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Stock Agent</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              variant="ghost"
              size="sm"
            >
              {showSidebar ? '隐藏' : '显示'}
            </Button>
            <Button
              onClick={() => setLocation('/ai-config')}
              variant="ghost"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3 animate-in fade-in slide-in-from-bottom-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-md lg:max-w-2xl px-4 py-2 rounded-lg',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs opacity-75">
                        {att.type.startsWith('image/') ? (
                          <Image className="w-3 h-3" />
                        ) : (
                          <File className="w-3 h-3" />
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
            <div className="flex gap-3 justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 附件显示区域 */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/50">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-background px-3 py-1 rounded-full text-sm"
                >
                  {att.type.startsWith('image/') ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                  <span className="truncate max-w-xs">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-border bg-background p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="输入你的问题..."
              disabled={isLoading}
              className="flex-1"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
