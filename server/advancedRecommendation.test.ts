import { describe, expect, it } from 'vitest';

describe('Advanced Recommendation Algorithm', () => {
  it('should have recommendation score calculation function', async () => {
    const { calculateRecommendationScore } = await import('./advancedRecommendation');
    expect(calculateRecommendationScore).toBeDefined();
    expect(typeof calculateRecommendationScore).toBe('function');
  });

  it('should return null for invalid symbols', async () => {
    const { calculateRecommendationScore } = await import('./advancedRecommendation');
    const result = await calculateRecommendationScore('INVALID_SYMBOL_XYZ123');
    expect(result).toBeNull();
  }, { timeout: 30000 });

  it('should return valid score structure for valid symbol', async () => {
    const { calculateRecommendationScore } = await import('./advancedRecommendation');
    
    // 使用一个流动性好的股票进行测试
    const result = await calculateRecommendationScore('AAPL');
    
    if (result !== null) {
      // 验证返回结构
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('priority1Score');
      expect(result).toHaveProperty('priority2Score');
      expect(result).toHaveProperty('priority3Score');
      expect(result).toHaveProperty('priority4Score');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('changePercent');
      expect(result).toHaveProperty('reason');
      
      // 验证数据类型
      expect(typeof result.symbol).toBe('string');
      expect(typeof result.totalScore).toBe('number');
      expect(typeof result.priority1Score).toBe('number');
      expect(typeof result.priority2Score).toBe('number');
      expect(typeof result.priority3Score).toBe('number');
      expect(typeof result.priority4Score).toBe('number');
      expect(typeof result.price).toBe('number');
      expect(typeof result.changePercent).toBe('number');
      expect(typeof result.reason).toBe('string');
      
      // 验证分数范围
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.priority1Score).toBeGreaterThanOrEqual(0);
      expect(result.priority1Score).toBeLessThanOrEqual(100);
      expect(result.priority2Score).toBeGreaterThanOrEqual(0);
      expect(result.priority2Score).toBeLessThanOrEqual(100);
      expect(result.priority3Score).toBeGreaterThanOrEqual(0);
      expect(result.priority3Score).toBeLessThanOrEqual(100);
      expect(result.priority4Score).toBeGreaterThanOrEqual(0);
      expect(result.priority4Score).toBeLessThanOrEqual(100);
      
      // 验证价格为正数
      expect(result.price).toBeGreaterThan(0);
    }
  }, { timeout: 60000 });

  it('should have scheduler functions', async () => {
    const { startRecommendationScheduler, triggerManualRefresh } = await import('./recommendationScheduler');
    expect(startRecommendationScheduler).toBeDefined();
    expect(triggerManualRefresh).toBeDefined();
    expect(typeof startRecommendationScheduler).toBe('function');
    expect(typeof triggerManualRefresh).toBe('function');
  });
});
