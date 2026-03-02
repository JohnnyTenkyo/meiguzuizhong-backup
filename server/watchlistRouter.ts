import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { watchlist, InsertWatchlist } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const watchlistRouter = router({
  // 获取用户的自选股列表
  getWatchlist: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    const db = await getDb();
    if (!db) {
      console.warn("[Watchlist] Database not available");
      return [];
    }

    try {
      const result = await db
        .select({ symbol: watchlist.symbol, addedAt: watchlist.addedAt })
        .from(watchlist)
        .where(eq(watchlist.userId, ctx.user.id))
        .orderBy(watchlist.addedAt);

      return result.map(r => r.symbol);
    } catch (error) {
      console.error("[Watchlist] Failed to get watchlist:", error);
      return [];
    }
  }),

  // 添加股票到自选
  addToWatchlist: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // 检查是否已存在
        const existing = await db
          .select()
          .from(watchlist)
          .where(
            and(
              eq(watchlist.userId, ctx.user.id),
              eq(watchlist.symbol, input.symbol)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return { success: true, message: "Already in watchlist" };
        }

        // 添加到自选
        await db.insert(watchlist).values({
          userId: ctx.user.id,
          symbol: input.symbol,
        } as InsertWatchlist);

        return { success: true, message: "Added to watchlist" };
      } catch (error) {
        console.error("[Watchlist] Failed to add to watchlist:", error);
        throw error;
      }
    }),

  // 从自选中删除股票
  removeFromWatchlist: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db
          .delete(watchlist)
          .where(
            and(
              eq(watchlist.userId, ctx.user.id),
              eq(watchlist.symbol, input.symbol)
            )
          );

        return { success: true, message: "Removed from watchlist" };
      } catch (error) {
        console.error("[Watchlist] Failed to remove from watchlist:", error);
        throw error;
      }
    }),

  // 切换股票的自选状态
  toggleWatchlist: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // 检查是否已存在
        const existing = await db
          .select()
          .from(watchlist)
          .where(
            and(
              eq(watchlist.userId, ctx.user.id),
              eq(watchlist.symbol, input.symbol)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // 删除
          await db
            .delete(watchlist)
            .where(
              and(
                eq(watchlist.userId, ctx.user.id),
                eq(watchlist.symbol, input.symbol)
              )
            );
          return { success: true, added: false };
        } else {
          // 添加
          await db.insert(watchlist).values({
            userId: ctx.user.id,
            symbol: input.symbol,
          } as InsertWatchlist);
          return { success: true, added: true };
        }
      } catch (error) {
        console.error("[Watchlist] Failed to toggle watchlist:", error);
        throw error;
      }
    }),

  // 清空自选股
  clearWatchlist: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      await db.delete(watchlist).where(eq(watchlist.userId, ctx.user.id));

      return { success: true, message: "Watchlist cleared" };
    } catch (error) {
      console.error("[Watchlist] Failed to clear watchlist:", error);
      throw error;
    }
  }),

  // 批量添加自选股(用于迁移本地数据)
  addMultipleToWatchlist: protectedProcedure
    .input(z.object({ symbols: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // 获取已存在的符号
        const existing = await db
          .select({ symbol: watchlist.symbol })
          .from(watchlist)
          .where(eq(watchlist.userId, ctx.user.id));

        const existingSymbols = new Set(existing.map(e => e.symbol));

        // 过滤出需要添加的符号
        const toAdd = input.symbols.filter(s => !existingSymbols.has(s));

        if (toAdd.length === 0) {
          return { success: true, added: 0 };
        }

        // 批量插入
        await db.insert(watchlist).values(
          toAdd.map(symbol => ({
            userId: ctx.user.id,
            symbol,
          } as InsertWatchlist))
        );

        return { success: true, added: toAdd.length };
      } catch (error) {
        console.error("[Watchlist] Failed to add multiple to watchlist:", error);
        throw error;
      }
    }),
});
