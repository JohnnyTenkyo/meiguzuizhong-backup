import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, watchlist } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Watchlist API", () => {
  let testUserId: number;
  let testUser: any;

  beforeAll(async () => {
    // 创建测试用户
    const db = await getDb();
    if (db) {
      const result = await db
        .insert(users)
        .values({
          openId: `test-watchlist-${Date.now()}`,
          name: "Test User",
          email: "test@example.com",
          role: "user",
        })
        .$returningId();
      testUserId = result[0].id;
      testUser = { id: testUserId, openId: `test-watchlist-${Date.now()}` };
    }
  });

  afterAll(async () => {
    // 清理测试数据
    const db = await getDb();
    if (db && testUserId) {
      await db.delete(watchlist).where(eq(watchlist.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should add stock to watchlist", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.watchlist.addToWatchlist({ symbol: "TSLA" });
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
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加几只股票
    await caller.watchlist.addToWatchlist({ symbol: "AAPL" });
    await caller.watchlist.addToWatchlist({ symbol: "NVDA" });

    // 获取自选股列表
    const list = await caller.watchlist.getWatchlist();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list).toContain("AAPL");
    expect(list).toContain("NVDA");
  });

  it("should remove stock from watchlist", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    await caller.watchlist.addToWatchlist({ symbol: "MSFT" });

    // 删除股票
    const result = await caller.watchlist.removeFromWatchlist({ symbol: "MSFT" });
    expect(result.success).toBe(true);

    // 验证已删除
    const list = await caller.watchlist.getWatchlist();
    expect(list).not.toContain("MSFT");
  });

  it("should toggle stock in watchlist", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    const addResult = await caller.watchlist.toggleWatchlist({ symbol: "GOOGL" });
    expect(addResult.success).toBe(true);
    expect(addResult.added).toBe(true);

    // 删除股票
    const removeResult = await caller.watchlist.toggleWatchlist({ symbol: "GOOGL" });
    expect(removeResult.success).toBe(true);
    expect(removeResult.added).toBe(false);
  });

  it("should add multiple stocks to watchlist", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const symbols = ["AMD", "INTC", "QCOM"];
    const result = await caller.watchlist.addMultipleToWatchlist({ symbols });
    expect(result.success).toBe(true);
    expect(result.added).toBeGreaterThanOrEqual(0);

    // 验证数据库中的数据
    const list = await caller.watchlist.getWatchlist();
    for (const symbol of symbols) {
      expect(list).toContain(symbol);
    }
  });

  it("should not add duplicate stocks", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // 添加股票
    await caller.watchlist.addToWatchlist({ symbol: "META" });

    // 再次添加相同的股票
    const result = await caller.watchlist.addToWatchlist({ symbol: "META" });
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
