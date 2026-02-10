import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("API Keys Configuration", () => {
  it("should have FINNHUB_API_KEY configured", () => {
    expect(ENV.finnhubApiKey).toBeTruthy();
    expect(ENV.finnhubApiKey.length).toBeGreaterThan(0);
  });

  it("should have ALPHAVANTAGE_API_KEY configured", () => {
    expect(ENV.alphaVantageApiKey).toBeTruthy();
    expect(ENV.alphaVantageApiKey.length).toBeGreaterThan(0);
  });

  it("should have TWITTER_AUTH_TOKEN configured", () => {
    expect(ENV.twitterAuthToken).toBeTruthy();
    expect(ENV.twitterAuthToken.length).toBeGreaterThan(0);
  });

  it("should have TWITTER_CT0 configured", () => {
    expect(ENV.twitterCt0).toBeTruthy();
    expect(ENV.twitterCt0.length).toBeGreaterThan(0);
  });

  it("should have ALPHAMOE_FOCI_API_KEY configured", () => {
    expect(ENV.alphamoeFociApiKey).toBeTruthy();
    expect(ENV.alphamoeFociApiKey.length).toBeGreaterThan(0);
  });
});
