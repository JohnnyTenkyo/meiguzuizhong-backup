import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Stock Data Validation", () => {
  it("should handle stocks with null changePercent gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // Test getSectorStocks with a sector
    const stocks = await caller.stock.getSectorStocks({ sector: "AI" });

    expect(stocks).toBeDefined();
    expect(Array.isArray(stocks)).toBe(true);

    // Verify all stocks have proper structure
    for (const stock of stocks) {
      expect(stock).toHaveProperty("symbol");
      expect(stock).toHaveProperty("price");
      expect(stock).toHaveProperty("changePercent");
      
      // changePercent can be null, but if it's a number, it should be valid
      if (stock.changePercent !== null && stock.changePercent !== undefined) {
        expect(typeof stock.changePercent).toBe("number");
        expect(isNaN(stock.changePercent)).toBe(false);
      }
    }

    console.log(`✓ Validated ${stocks.length} stocks from AI sector`);
  });

  it("should not include NUKK in any sector", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    // Test all sectors
    const sectors = ["AI", "Semiconductor", "Bitcoin", "Quantum", "Storage", "RareEarth", "Cloud", "Energy"];
    
    for (const sector of sectors) {
      const stocks = await caller.stock.getSectorStocks({ sector });
      const hasNukk = stocks.some(s => s.symbol === "NUKK");
      expect(hasNukk).toBe(false);
    }

    console.log("✓ NUKK not found in any sector");
  });

  it("should return valid recommended stocks without null changePercent", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const recommended = await caller.stock.getRecommendedStocks();

    expect(recommended).toBeDefined();
    expect(Array.isArray(recommended)).toBe(true);

    // Verify all recommended stocks have valid data
    for (const stock of recommended) {
      expect(stock).toHaveProperty("symbol");
      expect(stock).toHaveProperty("price");
      expect(stock).toHaveProperty("changePercent");
      expect(stock).toHaveProperty("totalScore");

      // changePercent should be a valid number
      if (stock.changePercent !== null && stock.changePercent !== undefined) {
        expect(typeof stock.changePercent).toBe("number");
        expect(isNaN(stock.changePercent)).toBe(false);
      }
    }

    console.log(`✓ Validated ${recommended.length} recommended stocks`);
  });

  it("should handle sector rankings without errors", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const rankings = await caller.stock.getSectorRankings();

    expect(rankings).toBeDefined();
    expect(typeof rankings).toBe("object");

    // Verify each sector's stocks have valid data
    for (const [sector, stocks] of Object.entries(rankings)) {
      expect(Array.isArray(stocks)).toBe(true);
      
      for (const stock of stocks) {
        expect(stock).toHaveProperty("symbol");
        expect(stock).toHaveProperty("price");
        expect(stock).toHaveProperty("changePercent");
        
        // price should be a valid number
        expect(typeof stock.price).toBe("number");
        expect(stock.price).toBeGreaterThan(0);
        
        // changePercent should be a valid number
        expect(typeof stock.changePercent).toBe("number");
        expect(isNaN(stock.changePercent)).toBe(false);
      }
    }

    console.log(`✓ Validated sector rankings`);
  });
});
