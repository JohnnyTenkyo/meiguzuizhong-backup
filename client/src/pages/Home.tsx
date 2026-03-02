import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, Star, TrendingUp, Zap, BarChart3, LogIn, LogOut, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginDialog from '@/components/LoginDialog';
import FociDashboard from '@/components/FociDashboard';
import FociAssistant from '@/components/FociAssistant';
import FociBloggerTracker from '@/components/FociBloggerTracker';
import VIPNewsFlow from '@/components/VIPNewsFlow';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { fetchStockQuote, US_STOCKS, SECTOR_NAMES } from '@/lib/stockApi';
import { trpc } from '@/lib/trpc';
import { StockQuote } from '@/lib/types';

// Market indices, crypto, and commodities
const MARKET_OVERVIEW = [
  { symbol: '^DJI', name: '道琼斯工业指数', emoji: '🇺🇸' },
  { symbol: '^GSPC', name: '标普500指数', emoji: '🇺🇸' },
  { symbol: '^IXIC', name: '纳斯达克综合指数', emoji: '🇺🇸' },
  { symbol: 'BTC-USD', name: '比特币/美元', emoji: '₿' },
  { symbol: 'GC=F', name: '黄金/美元', emoji: '🥇' },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isLoggedIn = isAuthenticated;
  const username = user?.name || user?.email || 'User';
  const { watchlist, isInWatchlist, toggleStock } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState<Set<string>>(new Set());

  // Fetch top gainers
  const { data: topGainers, isLoading: loadingGainers } = trpc.stock.getTopGainers.useQuery(
    { limit: 10 },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Fetch recommended stocks
  const { data: recommendedStocks, isLoading: loadingRecommended } = trpc.stock.getRecommendedStocks.useQuery(
    undefined,
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Fetch sector rankings
  const { data: sectorRankings, isLoading: loadingSectors } = trpc.stock.getSectorRankings.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Load market overview quotes
  useEffect(() => {
    const loadMarketOverview = async () => {
      for (const item of MARKET_OVERVIEW) {
        setLoadingQuotes(prev => new Set(prev).add(item.symbol));
        try {
          const q = await fetchStockQuote(item.symbol);
          setQuotes(prev => ({ ...prev, [item.symbol]: { ...q, name: item.name } }));
        } catch {
          // Skip failed quotes
        }
        setLoadingQuotes(prev => {
          const next = new Set(prev);
          next.delete(item.symbol);
          return next;
        });
      }
    };
    loadMarketOverview();
  }, []);

  // Load watchlist quotes (batch loading for better performance)
  useEffect(() => {
    const loadWatchlistQuotes = async () => {
      const symbolsToLoad = watchlist.filter(s => !quotes[s]);
      if (symbolsToLoad.length === 0) return;
      setLoadingQuotes(prev => new Set([...Array.from(prev), ...symbolsToLoad]));
      const batchSize = 5;
      for (let i = 0; i < symbolsToLoad.length; i += batchSize) {
        const batch = symbolsToLoad.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(symbol => fetchStockQuote(symbol)));
        const newQuotes: Record<string, any> = {};
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            newQuotes[batch[idx]] = result.value;
          }
        });
        setQuotes(prev => ({ ...prev, ...newQuotes }));
        setLoadingQuotes(prev => {
          const next = new Set(prev);
          batch.forEach(s => next.delete(s));
          return next;
        });
      }
    };
    if (watchlist.length > 0) loadWatchlistQuotes();
  }, [watchlist]);

  const filteredStocks = searchQuery.trim()
    ? US_STOCKS.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20)
    : [];

  const handleStockClick = useCallback((symbol: string) => {
    navigate(`/stock/${symbol}`);
  }, [navigate]);

  const handleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    toggleStock(symbol);
  };

  const StockRow = ({ symbol, showStar = true }: { symbol: string; showStar?: boolean }) => {
    const q = quotes[symbol];
    const isLoading = loadingQuotes.has(symbol);
    const isFav = isInWatchlist(symbol);

    return (
      <div
        onClick={() => handleStockClick(symbol)}
        className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-3">
          {showStar && (
            <button onClick={(e) => handleFavorite(e, symbol)} className="text-muted-foreground hover:text-yellow-400 transition-colors">
              <Star size={16} className={isFav ? 'fill-yellow-400 text-yellow-400' : ''} />
            </button>
          )}
          <span className="font-semibold text-sm tracking-wide">{symbol}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-muted-foreground text-xs">加载中...</span>
          ) : q ? (
            <>
              <span className="data-mono font-medium">${q.price.toFixed(2)}</span>
              <span className={`data-mono text-xs px-2 py-0.5 rounded font-medium ${
                (Number(q.changePercent) || 0) >= 0 
                  ? 'text-red-500 bg-red-500/10' 
                  : 'text-green-500 bg-green-500/10'
              }`}>
                {(Number(q.changePercent) || 0) >= 0 ? '+' : ''}{(Number(q.changePercent) || 0).toFixed(2)}%
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">--</span>
          )}
        </div>
      </div>
    );
  };

  // Market overview card
  const MarketCard = ({ item }: { item: typeof MARKET_OVERVIEW[0] }) => {
    const q = quotes[item.symbol];
    const isLoading = loadingQuotes.has(item.symbol);

    return (
      <div
        onClick={() => handleStockClick(item.symbol)}
        className="rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{item.emoji}</span>
          <div>
            <div className="text-xs text-muted-foreground">{item.name}</div>
            <div className="text-xs font-mono text-muted-foreground/70">{item.symbol}</div>
          </div>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground text-xs">加载中...</div>
        ) : q ? (
          <div className="flex items-end justify-between">
            <span className="data-mono text-lg font-bold">
              {q.price >= 10000 ? q.price.toFixed(0) : q.price.toFixed(2)}
            </span>
            <span className={`data-mono text-sm font-medium px-2 py-0.5 rounded ${
              q.change >= 0 
                ? 'text-red-500 bg-red-500/10' 
                : 'text-green-500 bg-green-500/10'
            }`}>
              {(q.changePercent ?? 0) >= 0 ? '+' : ''}{(q.changePercent ?? 0).toFixed(2)}%
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">--</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <BarChart3 size={22} className="text-primary" />
            <h1 className="text-lg font-bold tracking-tight">美股智能分析</h1>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User size={14} /> {username}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut size={14} />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>
                <LogIn size={14} className="mr-1" /> 登录
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Login suggestion */}
        {!isLoggedIn && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">登录后可使用收藏自选股等更多功能</p>
            <Button variant="outline" size="sm" onClick={() => setShowLogin(true)} className="text-xs">
              登录注册
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索股票代码 (如 TSLA, AAPL, NVDA...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {filteredStocks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-popover shadow-xl max-h-64 overflow-y-auto">
              {filteredStocks.map(s => (
                <button
                  key={s}
                  onClick={() => { handleStockClick(s); setSearchQuery(''); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{s}</span>
                  <TrendingUp size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Screener entry - 置顶 */}
        <div
          onClick={() => navigate('/screener')}
          className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <div>
              <div className="text-sm font-medium">条件选股</div>
              <div className="text-xs text-muted-foreground">买卖力道 · CD抄底 · 蓝色梯子 · 智能筛选</div>
            </div>
          </div>
          <span className="text-xs text-primary">开始筛选 →</span>
        </div>

        {/* Backtest entry - 置顶 */}
        <div
          onClick={() => navigate('/backtest')}
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            <div>
              <div className="text-sm font-medium">回测系统</div>
              <div className="text-xs text-muted-foreground">虚拟账户 · 历史模拟 · K线回放 · 指标验证</div>
            </div>
          </div>
          <span className="text-xs text-amber-500">开始回测 →</span>
        </div>

        {/* Market Overview - Three major indices + BTC + Gold */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-primary" /> 市场概览
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MARKET_OVERVIEW.map(item => (
              <MarketCard key={item.symbol} item={item} />
            ))}
          </div>
        </section>

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400" /> 我的自选 ({watchlist.length})
            </h2>
            <div className="grid gap-2">
              {watchlist.map(s => <StockRow key={s} symbol={s} />)}
            </div>
          </section>
        )}

        {/* Top Gainers */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-red-500" /> 今日涨幅榜
          </h2>
          {loadingGainers ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 animate-pulse">
                  <div className="h-5 bg-secondary rounded w-16 mb-3" />
                  <div className="h-4 bg-secondary rounded w-20 mb-2" />
                  <div className="h-6 bg-secondary rounded w-24" />
                </div>
              ))}
            </div>
          ) : topGainers && topGainers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {topGainers.slice(0, 10).map((stock: any) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleStockClick(stock.symbol)}
                  className="rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors p-3 flex flex-col gap-2"
                >
                  <span className="font-bold text-base tracking-wide">{stock.symbol}</span>
                  <div className="flex flex-col gap-1">
                    <span className="data-mono text-sm font-medium">${stock.price.toFixed(2)}</span>
                    <span className="data-mono text-xs px-2 py-1 rounded font-medium text-red-500 bg-red-500/10 text-center">
                      +{(stock.changePercent ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          )}
        </section>

        {/* Recommended Stocks */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-400" /> 推荐动能股
          </h2>
          {loadingRecommended ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-primary/30 bg-primary/5 p-3 animate-pulse">
                  <div className="h-5 bg-secondary rounded w-16 mb-3" />
                  <div className="h-3 bg-secondary rounded w-full mb-1" />
                  <div className="h-3 bg-secondary rounded w-3/4 mb-3" />
                  <div className="h-4 bg-secondary rounded w-20 mb-2" />
                  <div className="h-6 bg-secondary rounded w-24" />
                </div>
              ))}
            </div>
          ) : recommendedStocks && recommendedStocks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recommendedStocks.map((stock: any) => {
                const isStrongRecommendation = stock.totalScore && stock.totalScore > 80;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => handleStockClick(stock.symbol)}
                    className={`rounded-lg border cursor-pointer transition-all p-3 flex flex-col gap-2 relative ${
                      isStrongRecommendation 
                        ? 'border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10 shadow-lg shadow-yellow-500/20' 
                        : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    {/* 强力推荐徽章 */}
                    {isStrongRecommendation && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <span>★</span>
                        <span>强力推荐</span>
                      </div>
                    )}
                    
                    {/* 股票代码 */}
                    <span className="font-bold text-base tracking-wide">{stock.symbol}</span>
                    
                    {/* 推荐理由 */}
                    <p className="text-xs text-muted-foreground line-clamp-2">{stock.reason}</p>
                    
                    {/* 评分详情 */}
                    {stock.totalScore !== undefined && (
                      <div className="flex flex-col gap-1.5 mt-2 p-2 rounded bg-background/50 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">总评分</span>
                          <span className={`text-sm font-bold ${
                            stock.totalScore > 80 ? 'text-yellow-500' :
                            stock.totalScore > 60 ? 'text-blue-500' :
                            'text-muted-foreground'
                          }`}>
                            {stock.totalScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">梯子</span>
                            <span className="font-medium">{(stock.priority1Score || 0).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">禅动</span>
                            <span className="font-medium">{(stock.priority2Score || 0).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">缠论</span>
                            <span className="font-medium">{(stock.priority3Score || 0).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">动能</span>
                            <span className="font-medium">{(stock.priority4Score || 0).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 价格和涨跌幅 */}
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="data-mono text-sm font-medium">${stock.price.toFixed(2)}</span>
                      <span className={`data-mono text-xs px-2 py-1 rounded font-medium text-center ${
                        (stock.changePercent ?? 0) >= 0 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'text-green-500 bg-green-500/10'
                      }`}>
                        {(stock.changePercent ?? 0) >= 0 ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          )}
        </section>

        {/* Sector Rankings */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 size={14} className="text-primary" /> 板块榜
          </h2>
          {loadingSectors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                  <div className="h-5 bg-secondary rounded w-20 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="h-4 bg-secondary rounded w-14" />
                        <div className="h-4 bg-secondary rounded w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sectorRankings && Object.keys(sectorRankings).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(sectorRankings).map(([sector, stocks]: [string, any]) => (
                <div key={sector} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                  <h3 
                    className="text-sm font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/sector/${sector}`)}
                  >
                    {(SECTOR_NAMES as any)[sector] || sector}
                  </h3>
                  <div className="space-y-2">
                    {stocks.slice(0, 3).map((stock: any, idx: number) => (
                      <div
                        key={`${sector}-${stock.symbol}-${idx}`}
                        onClick={() => handleStockClick(stock.symbol)}
                        className="flex items-center justify-between text-sm cursor-pointer hover:text-primary transition-colors p-2 rounded hover:bg-accent/50"
                      >
                        <span className="font-semibold">{stock.symbol}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="data-mono text-xs">${stock.price.toFixed(2)}</span>
                          <span className={`data-mono text-xs px-1.5 py-0.5 rounded ${
                            (stock.changePercent ?? 0) >= 0
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-green-500 bg-green-500/10'
                          }`}>
                            {(stock.changePercent ?? 0) >= 0 ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          )}
        </section>

        {/* 重要人物信息流 */}
        <VIPNewsFlow watchlistTickers={watchlist} />

        {/* FOCI 智能助手 - 市场情绪面板 - 置底 */}
        <FociDashboard />

        {/* FOCI 博主持仓追踪 - 置底 */}
        <FociBloggerTracker />
      </main>

      <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
      <FociAssistant />
    </div>
  );
}
