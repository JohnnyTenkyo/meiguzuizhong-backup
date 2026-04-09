import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import StockAgent from './StockAgent';
import FociAssistant from './FociAssistant';
import { cn } from '@/lib/utils';

type AssistantType = 'stock' | 'foci' | null;

export default function AIAssistantContainer() {
  const [activeAssistant, setActiveAssistant] = useState<AssistantType>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAssistantToggle = (type: AssistantType) => {
    if (isMobile) {
      // 移动端：点击显示/关闭
      setActiveAssistant(activeAssistant === type ? null : type);
    } else {
      // 电脑端：鼠标悬停时显示
      setActiveAssistant(type);
    }
  };

  const handleClose = () => {
    setActiveAssistant(null);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-40"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && (setIsHovered(false), setActiveAssistant(null))}
    >
      {/* AI 助手标签容器 */}
      <div
        className={cn(
          'flex flex-col gap-3 transition-all duration-300 ease-out',
          isMobile || isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'
        )}
      >
        {/* Stock Agent 标签 */}
        <button
          onClick={() => handleAssistantToggle('stock')}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200',
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl',
            'hover:scale-105 active:scale-95'
          )}
          title="Stock Agent"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium whitespace-nowrap">Stock Agent</span>
        </button>

        {/* Foci 助手标签 */}
        <button
          onClick={() => handleAssistantToggle('foci')}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200',
            'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl',
            'hover:scale-105 active:scale-95'
          )}
          title="Foci 助手"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium whitespace-nowrap">Foci 助手</span>
        </button>
      </div>

      {/* 主浮窗按钮 (始终可见) */}
      <button
        onClick={() => setIsHovered(!isHovered)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-gradient-to-r from-indigo-500 to-blue-500 text-white',
          'shadow-lg hover:shadow-xl transition-all duration-200',
          'hover:scale-110 active:scale-95',
          'absolute bottom-0 right-0'
        )}
        title="AI 助手"
      >
        <MessageCircle size={24} />
      </button>

      {/* Stock Agent 窗口 */}
      {activeAssistant === 'stock' && (
        <div className="absolute bottom-20 right-0 z-50">
          <StockAgent onClose={handleClose} />
        </div>
      )}

      {/* Foci 助手窗口 */}
      {activeAssistant === 'foci' && (
        <div className="absolute bottom-20 right-0 z-50">
          <FociAssistant />
        </div>
      )}
    </div>
  );
}
