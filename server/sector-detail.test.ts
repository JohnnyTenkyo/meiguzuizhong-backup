import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Sector Detail Functionality", () => {
  it("should return stocks for AI sector", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const stocks = await caller.stock.getSectorStocks({ sector: "AI" });

    expect(stocks).toBeDefined();
    expect(Array.isArray(stocks)).toBe(true);
    expect(stocks.length).toBeGreaterThan(0);
    
    // 检查股票数据结构
    const firstStock = stocks[0];
    expect(firstStock).toHaveProperty("symbol");
    expect(firstStock).toHaveProperty("price");
    expect(firstStock).toHaveProperty("changePercent");
    
    console.log(`AI sector has ${stocks.length} stocks`);
    console.log(`Top 3:`, stocks.slice(0, 3).map(s => `${s.symbol}(${s.changePercent?.toFixed(2)}%)`).join(", "));
  });

  it("should return stocks for Quantum sector", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const stocks = await caller.stock.getSectorStocks({ sector: "Quantum" });

    expect(stocks).toBeDefined();
    expect(Array.isArray(stocks)).toBe(true);
    expect(stocks.length).toBeGreaterThan(0);
    
    console.log(`Quantum sector has ${stocks.length} stocks`);
  });

  it("should return stocks for Storage sector", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const stocks = await caller.stock.getSectorStocks({ sector: "Storage" });

    expect(stocks).toBeDefined();
    expect(Array.isArray(stocks)).toBe(true);
    expect(stocks.length).toBeGreaterThan(0);
    
    // 检查是否包含 SNDK
    const hasSndk = stocks.some(s => s.symbol === "SNDK");
    expect(hasSndk).toBe(true);
    
    console.log(`Storage sector has ${stocks.length} stocks`);
    console.log(`Includes SNDK:`, hasSndk);
  });

  it("should return stocks for RareEarth sector", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const stocks = await caller.stock.getSectorStocks({ sector: "RareEarth" });

    expect(stocks).toBeDefined();
    expect(Array.isArray(stocks)).toBe(true);
    expect(stocks.length).toBeGreaterThan(0);
    
    console.log(`RareEarth sector has ${stocks.length} stocks`);
  });

  it("should sort stocks by changePercent descending", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const stocks = await caller.stock.getSectorStocks({ sector: "AI" });

    // 检查排序是否正确(跳过null值)
    const validStocks = stocks.filter(s => s.changePercent !== null);
    for (let i = 0; i < validStocks.length - 1; i++) {
      expect(validStocks[i].changePercent!).toBeGreaterThanOrEqual(validStocks[i + 1].changePercent!);
    }
    
    console.log("Stocks are sorted by changePercent descending");
  });
});
