import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Drizzle migration journal", () => {
  it("references an existing SQL file for every migration entry", () => {
    const migrationsDir = join(process.cwd(), "drizzle");
    const journal = JSON.parse(
      readFileSync(join(migrationsDir, "meta", "_journal.json"), "utf8")
    ) as { entries: Array<{ tag: string }> };

    for (const entry of journal.entries) {
      expect(existsSync(join(migrationsDir, `${entry.tag}.sql`))).toBe(true);
    }
  });
});
