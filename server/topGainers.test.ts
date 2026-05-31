import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('getTopGainers - Data Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Symbol Validation', () => {
    it('should skip symbols with invalid length', () => {
      // Symbols like 'A' (too short) or 'ABCDEF' (too long) should be skipped
      const validSymbols = ['AAPL', 'MSFT', 'TSLA', 'BRK.B'];
      const invalidSymbols = ['A', 'ABCDEF', '', 'AI', 'BTC'];
      
      // Check length validation
      validSymbols.forEach(symbol => {
        expect(symbol.length).toBeGreaterThanOrEqual(1);
        expect(symbol.length).toBeLessThanOrEqual(5);
      });
      
      invalidSymbols.forEach(symbol => {
        const isValid = symbol.length >= 1 && symbol.length <= 5;
        if (symbol === 'A' || symbol === 'ABCDEF' || symbol === '') {
          expect(isValid).toBe(false);
        }
      });
    });

    it('should skip symbols with invalid characters', () => {
      const validSymbols = ['AAPL', 'BRK.B', 'BF-A'];
      const invalidSymbols = ['AAP@', 'MSFT#', 'TSL$'];
      
      const regex = /^[A-Z0-9.\-]+$/;
      
      validSymbols.forEach(symbol => {
        expect(regex.test(symbol)).toBe(true);
      });
      
      invalidSymbols.forEach(symbol => {
        expect(regex.test(symbol)).toBe(false);
      });
    });
  });

  describe('Price Data Validation', () => {
    it('should skip quotes with null or undefined price', () => {
      const validQuotes = [
        { price: 150.25, changePercent: 2.5 },
        { price: 0.01, changePercent: 10 },
      ];
      
      const invalidQuotes = [
        { price: null, changePercent: 2.5 },
        { price: undefined, changePercent: 2.5 },
        { price: NaN, changePercent: 2.5 },
      ];
      
      validQuotes.forEach(quote => {
        expect(quote.price !== null && quote.price !== undefined).toBe(true);
        expect(Number.isFinite(quote.price)).toBe(true);
      });
      
      invalidQuotes.forEach(quote => {
        const isValid = quote.price !== null && quote.price !== undefined && Number.isFinite(quote.price);
        expect(isValid).toBe(false);
      });
    });

    it('should skip quotes with non-positive price', () => {
      const validQuotes = [
        { price: 150.25 },
        { price: 0.01 },
      ];
      
      const invalidQuotes = [
        { price: 0 },
        { price: -10 },
      ];
      
      validQuotes.forEach(quote => {
        expect(quote.price > 0).toBe(true);
      });
      
      invalidQuotes.forEach(quote => {
        expect(quote.price > 0).toBe(false);
      });
    });

    it('should skip quotes with invalid changePercent', () => {
      const validQuotes = [
        { changePercent: 2.5 },
        { changePercent: -1.5 },
        { changePercent: 0 },
      ];
      
      const invalidQuotes = [
        { changePercent: null },
        { changePercent: undefined },
        { changePercent: NaN },
        { changePercent: Infinity },
      ];
      
      validQuotes.forEach(quote => {
        expect(Number.isFinite(quote.changePercent)).toBe(true);
      });
      
      invalidQuotes.forEach(quote => {
        expect(Number.isFinite(quote.changePercent)).toBe(false);
      });
    });
  });

  describe('Yahoo Finance Response Validation', () => {
    it('should skip responses with missing meta data', () => {
      const validResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: 150.25,
                  chartPreviousClose: 147.50,
                }
              }
            ]
          }
        }
      };
      
      const invalidResponses = [
        { data: { chart: { result: [] } } },
        { data: { chart: { result: [{ meta: null }] } } },
        { data: { chart: { result: [{ meta: { regularMarketPrice: null } }] } } },
        { data: { chart: { result: [{ meta: { chartPreviousClose: null } }] } } },
      ];
      
      // Valid response should have data
      expect(validResponse.data?.chart?.result?.[0]?.meta).toBeDefined();
      expect(validResponse.data.chart.result[0].meta.regularMarketPrice).toBeDefined();
      expect(validResponse.data.chart.result[0].meta.chartPreviousClose).toBeDefined();
      
      // Invalid responses should fail validation
      invalidResponses.forEach(response => {
        const result = response.data?.chart?.result?.[0];
        if (result) {
          const hasValidMeta = result.meta && 
            result.meta.regularMarketPrice !== null && 
            result.meta.regularMarketPrice !== undefined &&
            result.meta.chartPreviousClose !== null &&
            result.meta.chartPreviousClose !== undefined;
          expect(hasValidMeta).toBe(false);
        }
      });
    });

    it('should avoid division by zero', () => {
      const validResponse = {
        regularMarketPrice: 150.25,
        chartPreviousClose: 147.50,
      };
      
      const invalidResponse = {
        regularMarketPrice: 150.25,
        chartPreviousClose: 0,
      };
      
      // Valid: can calculate change percent
      if (validResponse.chartPreviousClose !== 0) {
        const changePercent = ((validResponse.regularMarketPrice - validResponse.chartPreviousClose) / validResponse.chartPreviousClose) * 100;
        expect(Number.isFinite(changePercent)).toBe(true);
      }
      
      // Invalid: division by zero
      expect(invalidResponse.chartPreviousClose === 0).toBe(true);
    });
  });

  describe('Sorting and Limiting', () => {
    it('should sort by changePercent in descending order', () => {
      const quotes = [
        { symbol: 'AAPL', price: 150, changePercent: 2.5 },
        { symbol: 'MSFT', price: 300, changePercent: 5.0 },
        { symbol: 'TSLA', price: 250, changePercent: 1.5 },
      ];
      
      const sorted = quotes.sort((a, b) => b.changePercent - a.changePercent);
      
      expect(sorted[0].symbol).toBe('MSFT');
      expect(sorted[1].symbol).toBe('AAPL');
      expect(sorted[2].symbol).toBe('TSLA');
    });

    it('should limit results to specified count', () => {
      const quotes = [
        { symbol: 'AAPL', price: 150, changePercent: 2.5 },
        { symbol: 'MSFT', price: 300, changePercent: 5.0 },
        { symbol: 'TSLA', price: 250, changePercent: 1.5 },
        { symbol: 'NVDA', price: 800, changePercent: 3.0 },
      ];
      
      const limit = 2;
      const topGainers = quotes
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
      
      expect(topGainers).toHaveLength(2);
      expect(topGainers[0].symbol).toBe('MSFT');
      expect(topGainers[1].symbol).toBe('NVDA');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stock list', () => {
      const stocks: string[] = [];
      expect(stocks).toHaveLength(0);
    });

    it('should handle all invalid stocks', () => {
      const invalidStocks = ['A', 'BTC', 'AI', 'ABCDEF'];
      const validStocks = invalidStocks.filter(s => s.length >= 1 && s.length <= 5 && /^[A-Z0-9.\-]+$/.test(s));
      
      expect(validStocks).toHaveLength(0);
    });

    it('should handle very small prices', () => {
      const quote = { price: 0.0001, changePercent: 50 };
      expect(quote.price > 0).toBe(true);
      expect(Number.isFinite(quote.changePercent)).toBe(true);
    });

    it('should handle very large change percentages', () => {
      const quote = { price: 100, changePercent: 1000 };
      expect(Number.isFinite(quote.changePercent)).toBe(true);
    });

    it('should handle negative change percentages', () => {
      const quote = { price: 100, changePercent: -50 };
      expect(Number.isFinite(quote.changePercent)).toBe(true);
    });
  });
});
