import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import StockAgent from './StockAgent';
import FociAssistant from './FociAssistant';
import { cn } from '@/lib/utils';

type AssistantType = 'stock' | 'foci' | null;

export default function AIAssistantContainer() {
  const [activeAssistant, setActiveAssistant] = useState<AssistantType>(null);
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
    setActiveAssistant(activeAssistant === type ? null : type);
  };

  const handleClose = () => {
    setActiveAssistant(null);
  };

  return (
    <div className="fixed bottom-6 right-0 z-40 flex items-end gap-0">
      {/* AI 助手标签容器 - 靠右隐藏的半圆 */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300 ease-out',
          activeAssistant ? 'translate-x-0' : 'translate-x-[calc(100%-3.5rem)]'
        )}
      >
        {/* Stock Agent 标签 */}
        <button
          onClick={() => handleAssistantToggle('stock')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-l-full transition-all duration-200',
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl',
            'hover:scale-105 active:scale-95 whitespace-nowrap',
            activeAssistant === 'stock' && 'ring-2 ring-offset-2 ring-blue-400'
          )}
          title="Stock Agent"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Stock Agent</span>
        </button>

        {/* Foci 助手标签 */}
        <button
          onClick={() => handleAssistantToggle('foci')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-l-full transition-all duration-200',
            'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl',
            'hover:scale-105 active:scale-95 whitespace-nowrap',
            activeAssistant === 'foci' && 'ring-2 ring-offset-2 ring-purple-400'
          )}
          title="Foci 助手"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Foci 助手</span>
        </button>
      </div>

      {/* Stock Agent 窗口 */}
      {activeAssistant === 'stock' && (
        <div className="absolute bottom-0 right-full mr-2">
          <StockAgent onClose={handleClose} />
        </div>
      )}

      {/* Foci 助手窗口 */}
      {activeAssistant === 'foci' && (
        <div className="absolute bottom-0 right-full mr-2">
          <FociAssistant />
        </div>
      )}
    </div>
  );
}
