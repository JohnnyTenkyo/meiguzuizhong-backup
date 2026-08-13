import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Twitter information-flow service", () => {
  it("resolves a screen name before requesting a user's tweets", () => {
    const service = readFileSync(
      join(process.cwd(), "server", "twitter_service.py"),
      "utf8"
    );

    expect(service).toContain("client.get_user_by_screen_name(username)");
    expect(service).toContain("client.get_user_tweets(user_id");
    expect(service).toContain("impersonate='chrome124'");
    expect(service).toContain("raw_tweets = getattr(result, 'data', None)");
    expect(service).toContain("raw_tweets = list(result)");
  });
});
