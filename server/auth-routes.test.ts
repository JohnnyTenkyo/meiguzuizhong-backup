import { describe, expect, it } from "vitest";
import { authApiRouter } from "./authRouter";
import { backtestApiRouter } from "./backtestRouter";

describe("Auth and Backtest Routes", () => {
  it("should have authApiRouter defined", () => {
    expect(authApiRouter).toBeDefined();
    expect(typeof authApiRouter).toBe("function");
  });

  it("should have backtestApiRouter defined", () => {
    expect(backtestApiRouter).toBeDefined();
    expect(typeof backtestApiRouter).toBe("function");
  });
});
