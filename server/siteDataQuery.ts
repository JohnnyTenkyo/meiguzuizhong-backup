/**
 * 站内数据查询模块
 * 为 Stock Agent 提供网站现有数据的查询接口
 */

import axios from "axios";

// 缓存机制
const cache: Map<string, { data: any; expires: number }> = new Map();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key: string, data: any, ttl: number): void {
  cache.set(key, { data, expires: Date.now() + ttl });
}

/**
 * 查询股票 K 线数据
 */
export async function queryKlineData(
  symbol: string,
  interval: string = "1d",
  limit: number = 100
): Promise<any> {
  const cacheKey = `kline:${symbol}:${interval}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 使用网站现有的 getKlines API
    const response = await axios.get(
      `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/api/trpc/stockAgent.getKlines`,
      {
        params: { symbol, interval },
        timeout: 10000,
      }
    );

    if (response.data?.result?.data) {
      const klineData = response.data.result.data;
      setCache(cacheKey, klineData, 300000); // 5 minutes
      return klineData;
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to query K-line data for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * 查询股票基本信息
 */
export async function queryStockInfo(symbol: string): Promise<any> {
  const cacheKey = `stock_info:${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 使用 Yahoo Finance 获取基本信息
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`,
      {
        params: {
          modules:
            "price,summaryDetail,defaultKeyStatistics,assetProfile,earnings",
        },
        timeout: 10000,
      }
    );

    if (response.data?.quoteSummary?.result) {
      const result = response.data.quoteSummary.result[0];
      const stockInfo = {
        symbol,
        name: result.assetProfile?.longBusinessSummary || symbol,
        price: result.price?.regularMarketPrice,
        currency: result.price?.currency,
        marketCap: result.summaryDetail?.marketCap?.raw,
        pe: result.summaryDetail?.trailingPE?.raw,
        dividend: result.summaryDetail?.dividendRate?.raw,
        beta: result.summaryDetail?.beta?.raw,
        eps: result.defaultKeyStatistics?.trailingEps?.raw,
        description: result.assetProfile?.longBusinessSummary,
      };
      setCache(cacheKey, stockInfo, 3600000); // 1 hour
      return stockInfo;
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to query stock info for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * 查询技术指标
 */
export async function queryTechnicalIndicators(
  symbol: string,
  interval: string = "1d"
): Promise<any> {
  const cacheKey = `indicators:${symbol}:${interval}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 获取 K 线数据
    const klineData = await queryKlineData(symbol, interval, 100);
    if (!klineData || !Array.isArray(klineData)) {
      return null;
    }

    // 计算基础指标
    const closes = klineData.map((k: any) => k.close || k.c);
    const highs = klineData.map((k: any) => k.high || k.h);
    const lows = klineData.map((k: any) => k.low || k.l);
    const volumes = klineData.map((k: any) => k.volume || k.v);

    // MA (移动平均线)
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);

    // RSI (相对强弱指数)
    const rsi14 = calculateRSI(closes, 14);

    // MACD
    const macd = calculateMACD(closes);

    // Bollinger Bands
    const bb = calculateBollingerBands(closes, 20);

    const indicators = {
      symbol,
      interval,
      currentPrice: closes[closes.length - 1],
      ma5: ma5[ma5.length - 1],
      ma10: ma10[ma10.length - 1],
      ma20: ma20[ma20.length - 1],
      rsi14: rsi14[rsi14.length - 1],
      macd: macd[macd.length - 1],
      bollingerBands: bb[bb.length - 1],
      trend: determineTrend(closes, ma20),
      strength: calculateStrength(closes, volumes),
    };

    setCache(cacheKey, indicators, 600000); // 10 minutes
    return indicators;
  } catch (error: any) {
    console.error(
      `Failed to query technical indicators for ${symbol}:`,
      error.message
    );
    return null;
  }
}

/**
 * 查询多个股票的综合信息
 */
export async function queryMultipleStocks(symbols: string[]): Promise<any[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const [info, indicators] = await Promise.all([
          queryStockInfo(symbol),
          queryTechnicalIndicators(symbol, "1d"),
        ]);
        return { symbol, info, indicators };
      } catch (error) {
        return { symbol, error: error instanceof Error ? error.message : "Unknown error" };
      }
    })
  );
  return results;
}

// 辅助函数

function calculateMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateRSI(data: number[], period: number): number[] {
  const result: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(0);
    } else {
      const diff = data[i] - data[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;

      if (i < period) {
        result.push(0);
      } else {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(rsi);
      }
    }
  }
  return result;
}

function calculateMACD(
  data: number[]
): Array<{ macd: number; signal: number; histogram: number }> {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);

  return macdLine.map((macd, i) => ({
    macd,
    signal: signalLine[i],
    histogram: macd - signalLine[i],
  }));
}

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else if (i < period) {
      const sum = data.slice(0, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / (i + 1));
    } else {
      result.push(data[i] * multiplier + result[i - 1] * (1 - multiplier));
    }
  }
  return result;
}

function calculateBollingerBands(
  data: number[],
  period: number
): Array<{ upper: number; middle: number; lower: number }> {
  const result: Array<{ upper: number; middle: number; lower: number }> = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ upper: 0, middle: 0, lower: 0 });
    } else {
      const subset = data.slice(i - period + 1, i + 1);
      const middle = subset.reduce((a, b) => a + b, 0) / period;
      const variance =
        subset.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) /
        period;
      const stdDev = Math.sqrt(variance);
      result.push({
        upper: middle + 2 * stdDev,
        middle,
        lower: middle - 2 * stdDev,
      });
    }
  }
  return result;
}

function determineTrend(closes: number[], ma20: number[]): string {
  const currentPrice = closes[closes.length - 1];
  const currentMA20 = ma20[ma20.length - 1];

  if (currentPrice > currentMA20) {
    return "uptrend";
  } else if (currentPrice < currentMA20) {
    return "downtrend";
  } else {
    return "neutral";
  }
}

function calculateStrength(
  closes: number[],
  volumes: number[]
): "strong" | "moderate" | "weak" {
  const recentChanges = closes.slice(-5).map((c, i) => {
    if (i === 0) return 0;
    return c > closes[closes.length - 5 + i - 1] ? 1 : -1;
  });
  const upCount = recentChanges.filter((c) => c > 0).length;
  const avgVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const currentVolume = volumes[volumes.length - 1];

  if (upCount >= 3 && currentVolume > avgVolume * 1.2) {
    return "strong";
  } else if (upCount >= 2 || currentVolume > avgVolume) {
    return "moderate";
  } else {
    return "weak";
  }
}
