import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface WatchlistContextType {
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  toggleStock: (symbol: string) => void;
  isLoading: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>([]);
  const [migrated, setMigrated] = useState(false);

  // 获取用户自选股
  const { data: userWatchlist, isLoading: watchlistLoading } = trpc.watchlist.getWatchlist.useQuery(
    undefined,
    { retry: 1 }
  );

  // 添加到自选
  const addMutation = trpc.watchlist.addToWatchlist.useMutation({
    onSuccess: () => {
      // 重新获取自选股列表
      void trpc.useUtils().watchlist.getWatchlist.invalidate();
    },
  });

  // 从自选中删除
  const removeMutation = trpc.watchlist.removeFromWatchlist.useMutation({
    onSuccess: () => {
      void trpc.useUtils().watchlist.getWatchlist.invalidate();
    },
  });

  // 切换自选状态
  const toggleMutation = trpc.watchlist.toggleWatchlist.useMutation({
    onSuccess: () => {
      void trpc.useUtils().watchlist.getWatchlist.invalidate();
    },
  });

  // 批量迁移本地数据
  const migrateMutation = trpc.watchlist.addMultipleToWatchlist.useMutation({
    onSuccess: () => {
      // 清除本地存储
      localStorage.removeItem('watchlist');
      setLocalWatchlist([]);
      setMigrated(true);
      // 重新获取自选股列表
      void trpc.useUtils().watchlist.getWatchlist.invalidate();
    },
  });

  // 初始化: 从数据库加载自选股
  useEffect(() => {
    if (userWatchlist) {
      setWatchlist(userWatchlist);
      setIsLoading(false);
    }
  }, [userWatchlist]);

  // 初始化: 检查本地存储并迁移
  useEffect(() => {
    if (!watchlistLoading && !migrated) {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalWatchlist(parsed);
            // 自动迁移本地数据到数据库
            migrateMutation.mutate({ symbols: parsed });
          }
        } catch (e) {
          console.error('Failed to parse local watchlist:', e);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [watchlistLoading, migrated]);

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      addMutation.mutate({ symbol });
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    removeMutation.mutate({ symbol });
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.includes(symbol);
  };

  const toggleStock = (symbol: string) => {
    if (isInWatchlist(symbol)) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleStock,
        isLoading: isLoading || watchlistLoading,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
}
