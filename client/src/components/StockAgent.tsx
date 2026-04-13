import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Settings, Upload, File, Image, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  createdAt: Date | number;
  updatedAt: Date | number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // tRPC 调用 - 使用 publicProcedure 以便不需要 OAuth 登录
  const createConversationMutation = trpc.stock.createConversation.useMutation();
  const getConversationsQuery = trpc.stock.getConversations.useQuery({ agentType: "stock" });
  const getMessagesQuery = trpc.stock.getMessages.useQuery({ threadId: currentThreadId || 0 }, { enabled: !!currentThreadId });
  const saveMessageMutation = trpc.stock.saveMessage.useMutation();
  const deleteConversationMutation = trpc.stock.deleteConversation.useMutation();
  const callAIMutation = trpc.stock.callAI.useMutation();

  // 加载对话列表
  useEffect(() => {
    if (getConversationsQuery.data) {
      setConversations(getConversationsQuery.data.map(conv => ({
        ...conv,
        createdAt: conv.createdAt instanceof Date ? conv.createdAt.getTime() : conv.createdAt,
        updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.getTime() : conv.updatedAt,
      })));
    }
  }, [getConversationsQuery.data]);

  // 加载对话消息
  useEffect(() => {
    if (getMessagesQuery.data && currentThreadId) {
      setMessages(getMessagesQuery.data.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt instanceof Date ? msg.createdAt.getTime() : new Date(msg.createdAt).getTime(),
      })));
    }
  }, [getMessagesQuery.data, currentThreadId]);

  // 自动滚动到底部
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
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

  // 已移到 useEffect 中处理

  const createNewConversation = async () => {
    try {
      const result = await createConversationMutation.mutateAsync({
        title: `对话 ${new Date().toLocaleString()}`,
        agentType: 'stock',
      });
      setCurrentThreadId(result.id);
      setMessages([
        {
          role: 'assistant',
          content: '你好！我是 Stock Agent，专业的股票分析助手。我可以帮你分析股票走势、解读技术指标、讨论投资策略等。有什么我可以帮你的吗？',
          timestamp: Date.now(),
        },
      ]);
      await getConversationsQuery.refetch?.();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const switchConversation = (threadId: number) => {
    setCurrentThreadId(threadId);
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
      await getConversationsQuery.refetch?.();
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

      // 添加附件内容
      if (attachments.length > 0) {
        for (const att of attachments) {
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
        }
      }

      const response = await callAIMutation.mutateAsync({
        baseUrl: currentConfig.baseUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的股票分析助手。请根据用户的问题提供专业的股票分析和投资建议。',
          },
          {
            role: 'user',
            content: messageContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.content;
    } catch (error: any) {
      console.error('Stock Agent error:', error);
      return `抱歉，我遇到了一些问题：${error.message || '无法连接到 AI 服务'}`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    // 如果没有对话线程，先创建一个
    if (!currentThreadId) {
      await createNewConversation();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input || `[已上传 ${attachments.length} 个文件]`,
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
    <div className={cn(
      "fixed z-50 bg-background border border-border rounded-xl shadow-2xl shadow-black/20 flex flex-col transition-all duration-200",
      "bottom-5 right-5 w-[400px] h-[600px] max-h-[85vh]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/50 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-blue-500/15 flex items-center justify-center">
            <MessageCircle className="size-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold">Stock Agent</h3>
            <p className="text-[10px] text-muted-foreground">输入股票代码或问题，获取实时分析</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setLocation('/ai-config')} 
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <Settings size={14} />
          </button>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
              <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="size-6 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Stock Agent</p>
                <p className="text-xs text-muted-foreground">
                  输入股票代码查看详情，或问我任何关于美股的问题
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 p-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="size-6 shrink-0 mt-0.5 rounded-full bg-blue-500/15 flex items-center justify-center">
                        <MessageCircle className="size-3 text-blue-400" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground'
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs opacity-75">
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
                  <div className="flex items-start gap-2">
                    <div className="size-6 shrink-0 mt-0.5 rounded-full bg-blue-500/15 flex items-center justify-center">
                      <MessageCircle className="size-3 text-blue-400" />
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2 flex items-center gap-2">
                      <Loader2 className="size-3 animate-spin text-blue-400" />
                      <span className="text-[11px] text-muted-foreground">思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-2 bg-background/50 shrink-0">
          <div className="flex gap-1.5 items-end">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="输入你的问题..."
              className="flex-1 resize-none bg-secondary rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[34px] max-h-[80px]"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="shrink-0 h-[34px] w-[34px] bg-blue-600 hover:bg-blue-500"
              disabled={!input.trim() || isLoading}
              onClick={handleSendMessage}
            >
              {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
