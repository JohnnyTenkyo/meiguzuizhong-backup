import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Recommended Stocks Display", () => {
  it("should return recommended stocks with all required fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.getRecommendedStocks();

    // 应该返回数组
    expect(Array.isArray(result)).toBe(true);
    
    // 应该至少有8个推荐
    expect(result.length).toBeGreaterThanOrEqual(8);
    
    // 检查每个推荐股票的字段
    result.forEach((stock: any) => {
      expect(stock).toHaveProperty("symbol");
      expect(stock).toHaveProperty("price");
      expect(stock).toHaveProperty("changePercent");
      expect(stock).toHaveProperty("reason");
      expect(stock).toHaveProperty("totalScore");
      expect(stock).toHaveProperty("priority1Score");
      expect(stock).toHaveProperty("priority2Score");
      expect(stock).toHaveProperty("priority3Score");
      expect(stock).toHaveProperty("priority4Score");
      
      // 检查分数类型
      expect(typeof stock.totalScore).toBe("number");
      expect(typeof stock.priority1Score).toBe("number");
      expect(typeof stock.priority2Score).toBe("number");
      expect(typeof stock.priority3Score).toBe("number");
      expect(typeof stock.priority4Score).toBe("number");
    });
    
    console.log(`✓ Returned ${result.length} recommended stocks with complete score details`);
  }, 60000); // 60 seconds timeout for API calls
});
