import { z } from "zod";
import { localProtectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { watchlist, trackedPeople } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getAutoFollowAccounts } from "./ceoMapping";

async function syncAutoFollowAccounts(db: any, localUserId: number, symbol: string) {
  for (const account of getAutoFollowAccounts(symbol)) {
    const handle = account.twitterHandle.trim().replace(/^@/, "");
    const existing = await db
      .select({ id: trackedPeople.id })
      .from(trackedPeople)
      .where(and(
        eq(trackedPeople.userId, localUserId),
        eq(trackedPeople.twitterHandle, handle),
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(trackedPeople).values({
        userId: localUserId,
        name: account.name,
        nameZh: account.nameZh,
        title: account.title,
        titleZh: account.titleZh,
        twitterHandle: handle,
        category: "科技",
        avatarEmoji: account.avatarEmoji,
      });
      console.log(`[Watchlist] Auto-followed @${handle} for ${symbol}`);
    }
  }
}

export const watchlistRouter = router({
  getWatchlist: localProtectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ symbol: watchlist.symbol })
      .from(watchlist)
      .where(eq(watchlist.localUserId, ctx.localUser.id))
      .orderBy(watchlist.addedAt);
    return rows.map(row => row.symbol);
  }),

  addToWatchlist: localProtectedProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const symbol = input.symbol.toUpperCase();
      const existing = await db.select({ id: watchlist.id }).from(watchlist)
        .where(and(eq(watchlist.localUserId, ctx.localUser.id), eq(watchlist.symbol, symbol))).limit(1);
      if (existing.length === 0) {
        await db.insert(watchlist).values({ localUserId: ctx.localUser.id, symbol });
      }
      await syncAutoFollowAccounts(db, ctx.localUser.id, symbol);
      return { success: true, added: existing.length === 0 };
    }),

  removeFromWatchlist: localProtectedProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(watchlist).where(and(
        eq(watchlist.localUserId, ctx.localUser.id),
        eq(watchlist.symbol, input.symbol.toUpperCase()),
      ));
      return { success: true };
    }),

  toggleWatchlist: localProtectedProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const symbol = input.symbol.toUpperCase();
      const existing = await db.select({ id: watchlist.id }).from(watchlist)
        .where(and(eq(watchlist.localUserId, ctx.localUser.id), eq(watchlist.symbol, symbol))).limit(1);
      if (existing.length > 0) {
        await db.delete(watchlist).where(and(eq(watchlist.localUserId, ctx.localUser.id), eq(watchlist.symbol, symbol)));
        return { success: true, added: false };
      }
      await db.insert(watchlist).values({ localUserId: ctx.localUser.id, symbol });
      await syncAutoFollowAccounts(db, ctx.localUser.id, symbol);
      return { success: true, added: true };
    }),

  addMultipleToWatchlist: localProtectedProcedure
    .input(z.object({ symbols: z.array(z.string().min(1)) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ symbol: watchlist.symbol }).from(watchlist)
        .where(eq(watchlist.localUserId, ctx.localUser.id));
      const known = new Set(existing.map(item => item.symbol));
      const toAdd = [...new Set(input.symbols.map(symbol => symbol.toUpperCase()))].filter(symbol => !known.has(symbol));
      if (toAdd.length > 0) {
        await db.insert(watchlist).values(toAdd.map(symbol => ({ localUserId: ctx.localUser.id, symbol })));
      }
      for (const symbol of [...known, ...toAdd]) await syncAutoFollowAccounts(db, ctx.localUser.id, symbol);
      return { success: true, added: toAdd.length };
    }),

  syncWatchlistTracking: localProtectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select({ symbol: watchlist.symbol }).from(watchlist)
      .where(eq(watchlist.localUserId, ctx.localUser.id));
    for (const row of rows) await syncAutoFollowAccounts(db, ctx.localUser.id, row.symbol);
    return { success: true, tickerCount: rows.length };
  }),

  removeInvalidSymbols: localProtectedProcedure
    .input(z.object({ invalidSymbols: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || input.invalidSymbols.length === 0) return { success: true, removed: 0 };
      for (const symbol of input.invalidSymbols) {
        await db.delete(watchlist).where(and(
          eq(watchlist.localUserId, ctx.localUser.id),
          eq(watchlist.symbol, symbol.toUpperCase()),
        ));
      }
      return { success: true, removed: input.invalidSymbols.length };
    }),

  clearWatchlist: localProtectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(watchlist).where(eq(watchlist.localUserId, ctx.localUser.id));
    return { success: true };
  }),
});
