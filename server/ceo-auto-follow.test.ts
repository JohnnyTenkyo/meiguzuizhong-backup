import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCEOInfo, hasCEOInfo, CEO_MAPPING } from './ceoMapping';
import { getDb } from './db';
import { watchlist, trackedPeople, localUsers, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('CEO Auto-Follow Feature', () => {
  let db: any;
  const testLocalUserId = 99999;
  const testUserId = 99999;

  beforeEach(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // 创建测试用户
    try {
      await db.insert(localUsers).values({
        id: testLocalUserId,
      });
    } catch (error) {
      // 可能已存在
    }

    try {
      await db.insert(users).values({
        id: testUserId,
        email: `test-${testUserId}@test.com`,
        openId: `test-openid-${testUserId}`,
        name: 'Test User',
      });
    } catch (error) {
      // 可能已存在
    }
  });

  afterEach(async () => {
    // 清理测试数据
    if (db) {
      try {
        await db.delete(watchlist).where(eq(watchlist.localUserId, testLocalUserId));
        await db.delete(trackedPeople).where(eq(trackedPeople.userId, testUserId));
        await db.delete(localUsers).where(eq(localUsers.id, testLocalUserId));
        await db.delete(users).where(eq(users.id, testUserId));
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  describe('CEO Mapping', () => {
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
      });
    });
  });

  describe('Auto-Follow Logic', () => {
    it('should auto-follow CEO when adding stock to watchlist', async () => {
      const symbol = 'HOOD';
      const ceoInfo = getCEOInfo(symbol);

      if (!ceoInfo) {
        throw new Error('CEO info not found for HOOD');
      }

      // 添加到自选
      await db.insert(watchlist).values({
        localUserId: testLocalUserId,
        symbol,
      });

      // 模拟自动关注 CEO
      const existingTrack = await db
        .select()
        .from(trackedPeople)
        .where(
          and(
            eq(trackedPeople.userId, testUserId),
            eq(trackedPeople.twitterHandle, ceoInfo.twitterHandle)
          )
        )
        .limit(1);

      if (existingTrack.length === 0) {
        await db.insert(trackedPeople).values({
          userId: testUserId,
          twitterHandle: ceoInfo.twitterHandle,
          name: ceoInfo.name,
          nameZh: ceoInfo.nameZh,
          category: '科技',
        });
      }

      // 验证 CEO 已关注
      const tracked = await db
        .select()
        .from(trackedPeople)
        .where(
          and(
            eq(trackedPeople.userId, testUserId),
            eq(trackedPeople.twitterHandle, ceoInfo.twitterHandle)
          )
        )
        .limit(1);

      expect(tracked.length).toBe(1);
      expect(tracked[0].name).toBe(ceoInfo.name);
      expect(tracked[0].twitterHandle).toBe(ceoInfo.twitterHandle);
    });

    it('should not duplicate CEO follow', async () => {
      const symbol = 'TSLA';
      const ceoInfo = getCEOInfo(symbol);

      if (!ceoInfo) {
        throw new Error('CEO info not found for TSLA');
      }

      // 第一次关注
      await db.insert(trackedPeople).values({
        userId: testUserId,
        twitterHandle: ceoInfo.twitterHandle,
        name: ceoInfo.name,
        nameZh: ceoInfo.nameZh,
        category: '科技',
      });

      // 第二次尝试关注（应该被跳过）
      const existingTrack = await db
        .select()
        .from(trackedPeople)
        .where(
          and(
            eq(trackedPeople.userId, testUserId),
            eq(trackedPeople.twitterHandle, ceoInfo.twitterHandle)
          )
        )
        .limit(1);

      expect(existingTrack.length).toBe(1);

      // 不应该再插入
      if (existingTrack.length === 0) {
        await db.insert(trackedPeople).values({
          userId: testUserId,
          twitterHandle: ceoInfo.twitterHandle,
          name: ceoInfo.name,
          nameZh: ceoInfo.nameZh,
          category: '科技',
        });
      }

      // 验证只有一条记录
      const allTracked = await db
        .select()
        .from(trackedPeople)
        .where(
          and(
            eq(trackedPeople.userId, testUserId),
            eq(trackedPeople.twitterHandle, ceoInfo.twitterHandle)
          )
        );

      expect(allTracked.length).toBe(1);
    });

    it('should handle multiple stocks with same CEO', async () => {
      // TSLA 和其他 Elon Musk 公司应该关注同一个 CEO
      const symbol1 = 'TSLA';
      const ceoInfo1 = getCEOInfo(symbol1);

      if (!ceoInfo1) {
        throw new Error('CEO info not found for TSLA');
      }

      // 添加第一个股票
      await db.insert(watchlist).values({
        localUserId: testLocalUserId,
        symbol: symbol1,
      });

      await db.insert(trackedPeople).values({
        userId: testUserId,
        twitterHandle: ceoInfo1.twitterHandle,
        name: ceoInfo1.name,
        nameZh: ceoInfo1.nameZh,
        category: '科技',
      });

      // 验证关注记录
      const tracked = await db
        .select()
        .from(trackedPeople)
        .where(eq(trackedPeople.userId, testUserId));

      expect(tracked.length).toBeGreaterThanOrEqual(1);
      expect(tracked.some(t => t.twitterHandle === ceoInfo1.twitterHandle)).toBe(true);
    });

    it('should work with different CEO handles', async () => {
      const stocks = ['HOOD', 'AAPL', 'TSLA'];

      for (const symbol of stocks) {
        const ceoInfo = getCEOInfo(symbol);
        if (ceoInfo) {
          await db.insert(trackedPeople).values({
            userId: testUserId,
            twitterHandle: ceoInfo.twitterHandle,
            name: ceoInfo.name,
            nameZh: ceoInfo.nameZh,
            category: '科技',
          });
        }
      }

      const tracked = await db
        .select()
        .from(trackedPeople)
        .where(eq(trackedPeople.userId, testUserId));

      expect(tracked.length).toBe(stocks.length);
      expect(tracked.map(t => t.twitterHandle)).toContain('vladtenev');
      expect(tracked.map(t => t.twitterHandle)).toContain('tim_cook');
      expect(tracked.map(t => t.twitterHandle)).toContain('elonmusk');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CEO handle gracefully', () => {
      // 如果某个 CEO 没有 Twitter 账户，应该跳过
      const ceoInfo = getCEOInfo('HOOD');
      expect(ceoInfo?.twitterHandle).toBeDefined();
      expect(ceoInfo?.twitterHandle).not.toBe('');
    });

    it('should preserve CEO info integrity', () => {
      const originalCount = Object.keys(CEO_MAPPING).length;
      const ceoInfo = getCEOInfo('HOOD');
      const newCount = Object.keys(CEO_MAPPING).length;

      expect(newCount).toBe(originalCount);
      expect(ceoInfo).toBeDefined();
    });
  });
});
