import { describe, it, expect, vi } from 'vitest';
import {
  getQuote,
  getKline,
  getPortfolio,
  checkOpenDStatus,
  formatStockCode,
} from './futuApi';

describe('Futu API Integration', () => {
  describe('getQuote', () => {
    it('应该返回成功的报价数据', async () => {
      const symbols = ['US.AAPL', 'HK.00700'];
      const result = await getQuote(symbols);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('symbol');
      expect(result.data[0]).toHaveProperty('price');
      expect(result.data[0]).toHaveProperty('change');
    });

    it('应该处理空数组', async () => {
      const result = await getQuote([]);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('应该返回有效的时间戳', async () => {
      const result = await getQuote(['US.AAPL']);
      
      expect(result.data[0].timestamp).toBeDefined();
      expect(() => new Date(result.data[0].timestamp)).not.toThrow();
    });
  });

  describe('getKline', () => {
    it('应该返回 K 线数据', async () => {
      const result = await getKline('US.AAPL', 'day', 10);
      
      expect(result.success).toBe(true);
      expect(result.symbol).toBe('US.AAPL');
      expect(result.period).toBe('day');
      expect(result.data).toHaveLength(10);
    });

    it('K 线数据应该包含必要字段', async () => {
      const result = await getKline('US.AAPL', 'day', 5);
      
      result.data.forEach(kline => {
        expect(kline).toHaveProperty('time');
        expect(kline).toHaveProperty('open');
        expect(kline).toHaveProperty('high');
        expect(kline).toHaveProperty('low');
        expect(kline).toHaveProperty('close');
        expect(kline).toHaveProperty('volume');
      });
    });

    it('应该使用默认数量 100', async () => {
      const result = await getKline('US.AAPL', 'day');
      
      expect(result.data).toHaveLength(100);
    });

    it('K 线数据应该按时间排序', async () => {
      const result = await getKline('US.AAPL', 'day', 10);
      
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].time >= result.data[i - 1].time).toBe(true);
      }
    });
  });

  describe('getPortfolio', () => {
    it('应该返回持仓信息', async () => {
      const result = await getPortfolio();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('cash');
      expect(result.data).toHaveProperty('positions');
      expect(result.data).toHaveProperty('totalValue');
    });

    it('持仓数据应该包含必要字段', async () => {
      const result = await getPortfolio();
      
      result.data.positions.forEach(position => {
        expect(position).toHaveProperty('symbol');
        expect(position).toHaveProperty('quantity');
        expect(position).toHaveProperty('price');
        expect(position).toHaveProperty('value');
      });
    });

    it('总价值应该等于现金加持仓价值', async () => {
      const result = await getPortfolio();
      const positionValue = result.data.positions.reduce((sum, p) => sum + p.value, 0);
      
      expect(result.data.totalValue).toBe(result.data.cash + positionValue);
    });
  });

  describe('checkOpenDStatus', () => {
    it('应该返回 OpenD 连接状态', async () => {
      const result = await checkOpenDStatus();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('host');
      expect(result).toHaveProperty('port');
    });

    it('应该返回正确的主机和端口', async () => {
      const result = await checkOpenDStatus();
      
      expect(result.host).toBe('127.0.0.1');
      expect(result.port).toBe(11111);
    });
  });

  describe('formatStockCode', () => {
    it('应该将中文名称转换为代码', () => {
      expect(formatStockCode('苹果')).toBe('US.AAPL');
      expect(formatStockCode('腾讯')).toBe('HK.00700');
      expect(formatStockCode('阿里')).toBe('HK.09988');
    });

    it('应该支持英文名称', () => {
      expect(formatStockCode('apple')).toBe('US.AAPL');
      expect(formatStockCode('AAPL')).toBe('US.AAPL');
      expect(formatStockCode('tesla')).toBe('US.TSLA');
    });

    it('应该返回未知代码原样', () => {
      expect(formatStockCode('UNKNOWN')).toBe('UNKNOWN');
      expect(formatStockCode('XYZ123')).toBe('XYZ123');
    });

    it('应该不区分大小写', () => {
      expect(formatStockCode('APPLE')).toBe('US.AAPL');
      expect(formatStockCode('Apple')).toBe('US.AAPL');
    });
  });
});
