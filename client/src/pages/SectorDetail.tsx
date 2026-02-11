import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { SECTOR_NAMES } from "@shared/stockPool";

export default function SectorDetail() {
  const [, params] = useRoute("/sector/:sector");
  const [, setLocation] = useLocation();
  const sector = params?.sector || "";

  const { data: sectorStocks, isLoading } = trpc.stock.getSectorStocks.useQuery(
    { sector },
    { enabled: !!sector }
  );

  const sectorName = (SECTOR_NAMES as any)[sector] || sector;

  // 计算板块整体涨跌幅
  const avgChangePercent = sectorStocks
    ? sectorStocks.reduce((sum: number, s: any) => sum + (s.changePercent || 0), 0) / sectorStocks.length
    : 0;

  const handleStockClick = (symbol: string) => {
    setLocation(`/stock/${symbol}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setLocation("/")}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-8 bg-secondary rounded w-32 animate-pulse" />
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                <div className="h-5 bg-secondary rounded w-20 mb-2" />
                <div className="h-4 bg-secondary rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sectorStocks || sectorStocks.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setLocation("/")}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">{sectorName}</h1>
          </div>
          <div className="text-center text-muted-foreground py-12">
            暂无该板块股票数据
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{sectorName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                共 {sectorStocks.length} 只股票
              </span>
              <span className="text-sm">·</span>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  avgChangePercent >= 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {avgChangePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                板块平均涨跌: {avgChangePercent >= 0 ? "+" : ""}
                {avgChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* 股票列表 */}
        <div className="grid gap-3">
          {sectorStocks.map((stock: any, idx: number) => (
            <div
              key={`${sector}-${stock.symbol}-${idx}`}
              onClick={() => handleStockClick(stock.symbol)}
              className="rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors p-4 flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="font-bold text-lg">{stock.symbol}</div>
                {stock.name && (
                  <div className="text-sm text-muted-foreground">{stock.name}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {stock.price !== null && stock.price !== undefined ? (
                  <>
                    <div className="font-bold text-lg">
                      ${stock.price.toFixed(2)}
                    </div>
                    {stock.changePercent !== null && stock.changePercent !== undefined && (
                      <div
                        className={`text-sm font-medium ${
                          stock.changePercent >= 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {stock.changePercent >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">数据加载中...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
