/**
 * Multi-source K-line data fetcher
 * Supports: Yahoo Finance, Tiingo, Alpaca, Stooq
 */

import axios from 'axios';

export interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlineResponse {
  symbol: string;
  interval: string;
  klines: KlineData[];
  source: 'yahoo' | 'tiingo' | 'alpaca' | 'stooq';
}

/**
 * Fetch K-line data from Yahoo Finance
 */
export async function fetchFromYahoo(
  symbol: string,
  interval: string = '1d',
  range: string = '1mo'
): Promise<KlineData[]> {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: { interval, range },
      timeout: 5000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const opens = result.indicators?.quote?.[0]?.open || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    return timestamps.map((ts: number, idx: number) => ({
      timestamp: ts * 1000,
      open: opens[idx] || 0,
      high: highs[idx] || 0,
      low: lows[idx] || 0,
      close: closes[idx] || 0,
      volume: volumes[idx] || 0,
    })).filter((k: KlineData) => k.close > 0);
  } catch (error) {
    console.error(`Failed to fetch from Yahoo for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch K-line data from Tiingo
 */
export async function fetchFromTiingo(
  symbol: string,
  interval: string = '1d',
  days: number = 30
): Promise<KlineData[]> {
  try {
    const token = process.env.TIINGO_API_KEY;
    if (!token) {
      console.warn('Tiingo API key not configured');
      return [];
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const response = await axios.get(`https://api.tiingo.com/tiingo/daily/${symbol}/prices`, {
      params: {
        token,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      timeout: 5000,
    });

    if (!Array.isArray(response.data)) return [];

    return response.data.map((item: any) => ({
      timestamp: new Date(item.date).getTime(),
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
    })).filter((k: KlineData) => k.close > 0);
  } catch (error) {
    console.error(`Failed to fetch from Tiingo for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch K-line data from Alpaca
 */
export async function fetchFromAlpaca(
  symbol: string,
  timeframe: string = '1Day',
  limit: number = 100
): Promise<KlineData[]> {
  try {
    const apiKey = process.env.ALPACA_API_KEY;
    if (!apiKey) {
      console.warn('Alpaca API key not configured');
      return [];
    }

    // Convert symbol to crypto format if needed
    const alpacaSymbol = symbol.includes('BTC') || symbol.includes('ETH') ? `${symbol}/USD` : symbol;

    const response = await axios.get('https://data.alpaca.markets/v1beta3/crypto/bars', {
      params: {
        symbols: alpacaSymbol,
        timeframe,
        limit,
      },
      headers: {
        'APCA-API-KEY-ID': apiKey,
      },
      timeout: 5000,
    });

    const bars = response.data?.bars?.[alpacaSymbol] || [];
    if (!Array.isArray(bars)) return [];

    return bars.map((bar: any) => ({
      timestamp: new Date(bar.t).getTime(),
      open: bar.o || 0,
      high: bar.h || 0,
      low: bar.l || 0,
      close: bar.c || 0,
      volume: bar.v || 0,
    })).filter((k: KlineData) => k.close > 0);
  } catch (error) {
    console.error(`Failed to fetch from Alpaca for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch K-line data from Stooq
 */
export async function fetchFromStooq(
  symbol: string,
  interval: string = 'd'
): Promise<KlineData[]> {
  try {
    // Stooq format: SYMBOL.US for US stocks
    const stooqSymbol = symbol.includes('.') ? symbol : `${symbol}.US`;

    const response = await axios.get(`https://stooq.com/q/export/`, {
      params: {
        s: stooqSymbol,
        i: interval,
        o: 'json',
      },
      timeout: 5000,
    });

    if (!response.data?.data || !Array.isArray(response.data.data)) return [];

    return response.data.data
      .reverse()
      .map((item: any) => ({
        timestamp: new Date(item.Date).getTime(),
        open: parseFloat(item.Open) || 0,
        high: parseFloat(item.High) || 0,
        low: parseFloat(item.Low) || 0,
        close: parseFloat(item.Close) || 0,
        volume: parseInt(item.Volume) || 0,
      }))
      .filter((k: KlineData) => k.close > 0);
  } catch (error) {
    console.error(`Failed to fetch from Stooq for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch K-line data from multiple sources with fallback
 */
export async function fetchKlineData(
  symbol: string,
  interval: string = '1d',
  sources: Array<'yahoo' | 'tiingo' | 'alpaca' | 'stooq'> = ['yahoo', 'tiingo', 'alpaca', 'stooq']
): Promise<KlineResponse | null> {
  for (const source of sources) {
    try {
      let klines: KlineData[] = [];

      switch (source) {
        case 'yahoo':
          klines = await fetchFromYahoo(symbol, interval);
          break;
        case 'tiingo':
          klines = await fetchFromTiingo(symbol, interval);
          break;
        case 'alpaca':
          klines = await fetchFromAlpaca(symbol, interval);
          break;
        case 'stooq':
          klines = await fetchFromStooq(symbol, interval);
          break;
      }

      if (klines.length > 0) {
        console.log(`[KlineData] Successfully fetched ${klines.length} candles from ${source} for ${symbol}`);
        return {
          symbol,
          interval,
          klines: klines.sort((a, b) => a.timestamp - b.timestamp),
          source,
        };
      }
    } catch (error) {
      console.warn(`[KlineData] Failed to fetch from ${source} for ${symbol}:`, error);
      continue;
    }
  }

  console.error(`[KlineData] Failed to fetch K-line data for ${symbol} from all sources`);
  return null;
}

/**
 * Fetch multiple timeframes for a symbol
 */
export async function fetchMultipleTimeframes(
  symbol: string,
  timeframes: string[] = ['1d', '4h', '1h', '30m', '15m', '5m', '1m']
): Promise<Record<string, KlineResponse | null>> {
  const results: Record<string, KlineResponse | null> = {};

  for (const timeframe of timeframes) {
    results[timeframe] = await fetchKlineData(symbol, timeframe);
  }

  return results;
}
