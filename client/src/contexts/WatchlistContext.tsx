import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { skipToken } from '@tanstack/react-query';

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
  const [localUserId, setLocalUserId] = useState<number | null>(null);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>([]);
  const [migrated, setMigrated] = useState(false);

  // 从 localStorage 获取 localUserId
  useEffect(() => {
    const stored = localStorage.getItem('localUserId');
    if (stored) {
      setLocalUserId(parseInt(stored, 10));
    } else {
      setIsLoading(false);
    }
  }, []);

  // 获取用户自选股
  const { data: userWatchlist, isLoading: watchlistLoading } = trpc.watchlist.getWatchlist.useQuery(
    localUserId ? { localUserId } : skipToken,
    { enabled: !!localUserId, retry: 1 }
  );

  // 添加到自选
  const addMutation = trpc.watchlist.addToWatchlist.useMutation({
    onSuccess: () => {
      if (localUserId) {
        void trpc.useUtils().watchlist.getWatchlist.invalidate({ localUserId });
      }
    },
  });

  // 从自选中删除
  const removeMutation = trpc.watchlist.removeFromWatchlist.useMutation({
    onSuccess: () => {
      if (localUserId) {
        void trpc.useUtils().watchlist.getWatchlist.invalidate({ localUserId });
      }
    },
  });

  // 切换自选状态
  const toggleMutation = trpc.watchlist.toggleWatchlist.useMutation({
    onSuccess: () => {
      if (localUserId) {
        void trpc.useUtils().watchlist.getWatchlist.invalidate({ localUserId });
      }
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
      if (localUserId) {
        void trpc.useUtils().watchlist.getWatchlist.invalidate({ localUserId });
      }
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
    if (localUserId && !migrated) {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalWatchlist(parsed);
            // 自动迁移本地数据到数据库
            migrateMutation.mutate({ localUserId, symbols: parsed });
          }
        } catch (e) {
          console.error('Failed to parse local watchlist:', e);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [localUserId, watchlistLoading, migrated]);

  const addToWatchlist = (symbol: string) => {
    console.log('[Watchlist] addToWatchlist called:', { symbol, localUserId });
    if (!localUserId) {
      console.warn('[Watchlist] No localUserId, cannot add to watchlist');
      return;
    }
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      addMutation.mutate({ localUserId, symbol });
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    console.log('[Watchlist] removeFromWatchlist called:', { symbol, localUserId });
    if (!localUserId) {
      console.warn('[Watchlist] No localUserId, cannot remove from watchlist');
      return;
    }
    setWatchlist(prev => prev.filter(s => s !== symbol));
    removeMutation.mutate({ localUserId, symbol });
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.includes(symbol);
  };

  const toggleStock = (symbol: string) => {
    console.log('[Watchlist] toggleStock called:', { symbol, localUserId, isInWatchlist: isInWatchlist(symbol) });
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
