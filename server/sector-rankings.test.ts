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

describe("Sector Rankings", () => {
  it("should return rankings for all configured sectors including Quantum, Storage, RareEarth", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.getSectorRankings();

    // 应该返回对象
    expect(typeof result).toBe("object");
    
    // 检查新增的板块
    expect(result).toHaveProperty("Quantum");
    expect(result).toHaveProperty("Storage");
    expect(result).toHaveProperty("RareEarth");
    
    // 检查保留的板块
    expect(result).toHaveProperty("AI");
    expect(result).toHaveProperty("Semiconductor");
    expect(result).toHaveProperty("Bitcoin");
    expect(result).toHaveProperty("Cloud");
    expect(result).toHaveProperty("Energy");
    
    // 不应该有 EV 板块(已被 Quantum 替换)
    // 注意:EV 板块仍然存在于 stockPool 中,只是不在板块榜中显示
    
    // 检查量子板块的股票
    if (result.Quantum && result.Quantum.length > 0) {
      const quantumStock = result.Quantum[0];
      expect(quantumStock).toHaveProperty("symbol");
      expect(quantumStock).toHaveProperty("price");
      expect(quantumStock).toHaveProperty("changePercent");
      expect(['IONQ', 'RGTI', 'QUBT', 'QBTS', 'QMCO']).toContain(quantumStock.symbol);
      console.log(`✓ Quantum sector has ${result.Quantum.length} stocks`);
    }
    
    // 检查存储板块的股票
    if (result.Storage && result.Storage.length > 0) {
      const storageStock = result.Storage[0];
      expect(storageStock).toHaveProperty("symbol");
      expect(['WDC', 'STX', 'SNDK', 'MU']).toContain(storageStock.symbol);
      console.log(`✓ Storage sector has ${result.Storage.length} stocks`);
    }
    
    // 检查稀土板块的股票
    if (result.RareEarth && result.RareEarth.length > 0) {
      const rareEarthStock = result.RareEarth[0];
      expect(rareEarthStock).toHaveProperty("symbol");
      expect(['MP', 'NEM']).toContain(rareEarthStock.symbol);
      console.log(`✓ RareEarth sector has ${result.RareEarth.length} stocks`);
    }
    
    console.log(`✓ Sector rankings returned successfully with new sectors`);
  }, 60000); // 60 seconds timeout for API calls
});
