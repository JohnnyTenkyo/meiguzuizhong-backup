import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { localUsers, watchlist } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Watchlist API", () => {
  let testLocalUserId: number;

  beforeAll(async () => {
    // 创建测试用户
    const db = await getDb();
    if (db) {
      const result = await db
        .insert(localUsers)
        .values({
          username: `test-watchlist-${Date.now()}`,
          passwordHash: "test-hash",
          name: "Test User",
        })
        .$returningId();
      testLocalUserId = result[0].id;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    const db = await getDb();
    if (db && testLocalUserId) {
      await db.delete(watchlist).where(eq(watchlist.localUserId, testLocalUserId));
      await db.delete(localUsers).where(eq(localUsers.id, testLocalUserId));
    }
  });

  it("should add stock to watchlist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "TSLA" });
    expect(result.success).toBe(true);

    // 验证数据库中的数据
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.symbol, "TSLA"));
      expect(saved.length).toBeGreaterThan(0);
    }
  });

  it("should get watchlist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加几只股票
    await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "AAPL" });
    await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "NVDA" });

    // 获取自选股列表
    const list = await caller.watchlist.getWatchlist({ localUserId: testLocalUserId });
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list).toContain("AAPL");
    expect(list).toContain("NVDA");
  });

  it("should remove stock from watchlist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "MSFT" });

    // 删除股票
    const result = await caller.watchlist.removeFromWatchlist({ localUserId: testLocalUserId, symbol: "MSFT" });
    expect(result.success).toBe(true);

    // 验证已删除
    const list = await caller.watchlist.getWatchlist({ localUserId: testLocalUserId });
    expect(list).not.toContain("MSFT");
  });

  it("should toggle stock in watchlist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    const addResult = await caller.watchlist.toggleWatchlist({ localUserId: testLocalUserId, symbol: "GOOGL" });
    expect(addResult.success).toBe(true);
    expect(addResult.added).toBe(true);

    // 删除股票
    const removeResult = await caller.watchlist.toggleWatchlist({ localUserId: testLocalUserId, symbol: "GOOGL" });
    expect(removeResult.success).toBe(true);
    expect(removeResult.added).toBe(false);
  });

  it("should add multiple stocks to watchlist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const symbols = ["AMD", "INTC", "QCOM"];
    const result = await caller.watchlist.addMultipleToWatchlist({ localUserId: testLocalUserId, symbols });
    expect(result.success).toBe(true);
    expect(result.added).toBeGreaterThanOrEqual(0);

    // 验证数据库中的数据
    const list = await caller.watchlist.getWatchlist({ localUserId: testLocalUserId });
    for (const symbol of symbols) {
      expect(list).toContain(symbol);
    }
  });

  it("should not add duplicate stocks", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "META" });

    // 再次添加相同的股票
    const result = await caller.watchlist.addToWatchlist({ localUserId: testLocalUserId, symbol: "META" });
    expect(result.success).toBe(true);

    // 验证只有一条记录
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.symbol, "META"));
      expect(saved.length).toBe(1);
    }
  });
});
