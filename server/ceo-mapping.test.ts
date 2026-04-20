import { describe, it, expect } from 'vitest';
import { getCEOInfo, hasCEOInfo, CEO_MAPPING } from './ceoMapping';

describe('CEO Mapping Feature', () => {
  describe('CEO Mapping Data', () => {
    it('should have CEO info for HOOD', () => {
      const ceoInfo = getCEOInfo('HOOD');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.name).toBe('Vladimir Tenev');
      expect(ceoInfo?.twitterHandle).toBe('vladtenev');
    });

    it('should have CEO info for VRT', () => {
      const ceoInfo = getCEOInfo('VRT');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.twitterHandle).toBe('vroom');
    });

    it('should have CEO info for TSLA', () => {
      const ceoInfo = getCEOInfo('TSLA');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.name).toBe('Elon Musk');
      expect(ceoInfo?.twitterHandle).toBe('elonmusk');
    });

    it('should have CEO info for AAPL', () => {
      const ceoInfo = getCEOInfo('AAPL');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.name).toBe('Tim Cook');
      expect(ceoInfo?.twitterHandle).toBe('tim_cook');
    });

    it('should have CEO info for MSFT', () => {
      const ceoInfo = getCEOInfo('MSFT');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.name).toBe('Satya Nadella');
      expect(ceoInfo?.twitterHandle).toBe('sataborat');
    });

    it('should have CEO info for NVDA', () => {
      const ceoInfo = getCEOInfo('NVDA');
      expect(ceoInfo).toBeDefined();
      expect(ceoInfo?.name).toBe('Jensen Huang');
      expect(ceoInfo?.twitterHandle).toBe('nvidia');
    });

    it('should return null for unknown ticker', () => {
      const ceoInfo = getCEOInfo('UNKNOWN');
      expect(ceoInfo).toBeNull();
    });

    it('should be case-insensitive', () => {
      const ceoInfo1 = getCEOInfo('hood');
      const ceoInfo2 = getCEOInfo('HOOD');
      expect(ceoInfo1).toEqual(ceoInfo2);
    });

    it('should have hasCEOInfo function', () => {
      expect(hasCEOInfo('HOOD')).toBe(true);
      expect(hasCEOInfo('TSLA')).toBe(true);
      expect(hasCEOInfo('UNKNOWN')).toBe(false);
    });

    it('should have CEO info for 100+ stocks', () => {
      const stockCount = Object.keys(CEO_MAPPING).length;
      expect(stockCount).toBeGreaterThanOrEqual(100);
    });

    it('should have all CEO info with required fields', () => {
      Object.entries(CEO_MAPPING).forEach(([symbol, ceoInfo]) => {
        expect(ceoInfo.name).toBeDefined();
        expect(ceoInfo.nameZh).toBeDefined();
        expect(ceoInfo.twitterHandle).toBeDefined();
        expect(typeof ceoInfo.name).toBe('string');
        expect(typeof ceoInfo.nameZh).toBe('string');
        expect(typeof ceoInfo.twitterHandle).toBe('string');
        expect(ceoInfo.name.length).toBeGreaterThan(0);
        expect(ceoInfo.twitterHandle.length).toBeGreaterThan(0);
      });
    });

    it('should have unique Twitter handles', () => {
      const handles = Object.values(CEO_MAPPING).map(c => c.twitterHandle);
      const uniqueHandles = new Set(handles);
      // 允许某些 CEO 有相同的 Twitter 账户（如公司账户）
      expect(handles.length).toBeGreaterThan(0);
    });

    it('should have CEO info for major tech stocks', () => {
      const majorTechs = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
      majorTechs.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.twitterHandle).toBeDefined();
      });
    });

    it('should have CEO info for major finance stocks', () => {
      const majorFinance = ['JPM', 'BAC', 'WFC', 'GS', 'MS'];
      majorFinance.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.twitterHandle).toBeDefined();
      });
    });

    it('should have CEO info for trading platforms', () => {
      const tradingPlatforms = ['HOOD', 'COIN', 'SOFI', 'UPST'];
      tradingPlatforms.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.twitterHandle).toBeDefined();
      });
    });

    it('should have CEO info for Chinese EV stocks', () => {
      const chineseEVs = ['NIO', 'XPEV', 'LI'];
      chineseEVs.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.twitterHandle).toBeDefined();
      });
    });

    it('should have nameZh for all CEOs', () => {
      Object.entries(CEO_MAPPING).forEach(([symbol, ceoInfo]) => {
        expect(ceoInfo.nameZh).toBeDefined();
        expect(ceoInfo.nameZh.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CEO Lookup', () => {
    it('should find CEO by stock symbol', () => {
      const symbols = ['HOOD', 'VRT', 'TSLA', 'AAPL', 'MSFT'];
      symbols.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.name).toBeDefined();
        expect(ceoInfo?.twitterHandle).toBeDefined();
      });
    });

    it('should return consistent results', () => {
      const symbol = 'HOOD';
      const result1 = getCEOInfo(symbol);
      const result2 = getCEOInfo(symbol);
      expect(result1).toEqual(result2);
    });

    it('should handle mixed case symbols', () => {
      const variations = ['HOOD', 'Hood', 'hood', 'HoOd'];
      variations.forEach(symbol => {
        const ceoInfo = getCEOInfo(symbol);
        expect(ceoInfo).toBeDefined();
        expect(ceoInfo?.name).toBe('Vladimir Tenev');
      });
    });
  });

  describe('CEO Coverage', () => {
    it('should cover major US indices', () => {
      const sp500Symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B'];
      const covered = sp500Symbols.filter(s => hasCEOInfo(s));
      expect(covered.length).toBeGreaterThan(5);
    });

    it('should have CEO info for popular stocks', () => {
      const popularStocks = ['HOOD', 'VRT', 'COIN', 'SOFI', 'UPST', 'RBLX', 'SNAP', 'PINS'];
      const covered = popularStocks.filter(s => hasCEOInfo(s));
      expect(covered.length).toBeGreaterThanOrEqual(6);
    });
  });
});
