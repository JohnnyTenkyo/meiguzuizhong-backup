import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAutoFollowAccounts } from "./ceoMapping";

describe("local tracking contracts", () => {
  it("authenticates tracking requests with the local JWT", () => {
    const context = readFileSync(join(process.cwd(), "server", "_core", "context.ts"), "utf8");
    const trpc = readFileSync(join(process.cwd(), "server", "_core", "trpc.ts"), "utf8");
    const client = readFileSync(join(process.cwd(), "client", "src", "main.tsx"), "utf8");
    const newsflow = readFileSync(join(process.cwd(), "server", "newsflowRouter.ts"), "utf8");

    expect(context).toContain("verifyToken(token)");
    expect(trpc).toContain("localProtectedProcedure");
    expect(client).toContain("Authorization: `Bearer ${token}`");
    expect(newsflow).toContain("getTrackedPeople: localProtectedProcedure");
  });

  it("returns CEO and company accounts without duplicate X handles", () => {
    const accounts = getAutoFollowAccounts("TSLA");
    const handles = accounts.map(account => account.twitterHandle.toLowerCase());
    expect(handles).toContain("elonmusk");
    expect(handles).toContain("tesla");
    expect(new Set(handles).size).toBe(accounts.length);
  });
});
