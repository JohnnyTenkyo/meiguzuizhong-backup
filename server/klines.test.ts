import { describe, it, expect } from 'vitest';
import { fetchKlineData, fetchFromYahoo, fetchFromTiingo } from './multiSourceKlines';

describe('K-line Data Fetching', () => {
  it('should fetch K-line data from Yahoo Finance', async () => {
    const klines = await fetchFromYahoo('AAPL', '1d', '1mo');
    expect(Array.isArray(klines)).toBe(true);
    expect(klines.length).toBeGreaterThan(0);
    
    // Verify structure
    if (klines.length > 0) {
      const kline = klines[0];
      expect(kline).toHaveProperty('timestamp');
      expect(kline).toHaveProperty('open');
      expect(kline).toHaveProperty('high');
      expect(kline).toHaveProperty('low');
      expect(kline).toHaveProperty('close');
      expect(kline).toHaveProperty('volume');
      expect(typeof kline.close).toBe('number');
      expect(kline.close).toBeGreaterThan(0);
    }
  }, { timeout: 10000 });

  it('should fetch K-line data from multiple sources with fallback', async () => {
    const result = await fetchKlineData('AAPL', '1d');
    expect(result).not.toBeNull();
    
    if (result) {
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('interval');
      expect(result).toHaveProperty('klines');
      expect(result).toHaveProperty('source');
      expect(Array.isArray(result.klines)).toBe(true);
      expect(result.klines.length).toBeGreaterThan(0);
      expect(['yahoo', 'tiingo', 'alpaca', 'stooq']).toContain(result.source);
      
      console.log(`✓ Fetched ${result.klines.length} candles from ${result.source}`);
    }
  }, { timeout: 15000 });

  it('should handle invalid symbols gracefully', async () => {
    const result = await fetchKlineData('INVALID_SYMBOL_XYZ', '1d');
    // Should return null or empty array, not throw
    expect(result === null || (result && result.klines.length === 0)).toBe(true);
  }, { timeout: 15000 });

  it('should support different intervals', async () => {
    const intervals = ['1d', '1h'];
    
    for (const interval of intervals) {
      const result = await fetchKlineData('AAPL', interval);
      if (result) {
        expect(result.interval).toBe(interval);
        console.log(`✓ Fetched ${interval} interval data: ${result.klines.length} candles`);
      }
    }
  }, { timeout: 20000 });
});
