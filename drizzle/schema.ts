import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Local authentication users table (for backtest feature)
 */
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  name: varchar("name", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

/**
 * Backtest sessions table
 */
export const backtestSessions = mysqlTable("backtest_sessions", {
  id: int("id").autoincrement().primaryKey(),
  localUserId: int("localUserId").notNull().references(() => localUsers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  initialBalance: decimal("initialBalance", { precision: 16, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 16, scale: 2 }).notNull(),
  totalAssets: decimal("totalAssets", { precision: 16, scale: 2 }),
  totalPnL: decimal("totalPnL", { precision: 16, scale: 2 }),
  totalPnLpercent: decimal("totalPnLpercent", { precision: 10, scale: 4 }),
  startDate: bigint("startDate", { mode: "number" }).notNull(),
  currentDate: bigint("currentDate", { mode: "number" }).notNull(),
  currentInterval: varchar("currentInterval", { length: 10 }).default("1d"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BacktestSession = typeof backtestSessions.$inferSelect;
export type InsertBacktestSession = typeof backtestSessions.$inferInsert;

/**
 * Backtest trades table
 */
export const backtestTrades = mysqlTable("backtest_trades", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => backtestSessions.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 16, scale: 4 }).notNull(),
  amount: decimal("amount", { precision: 16, scale: 2 }).notNull(),
  tradeDate: bigint("tradeDate", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BacktestTrade = typeof backtestTrades.$inferSelect;
export type InsertBacktestTrade = typeof backtestTrades.$inferInsert;

/**
 * Backtest positions table
 */
export const backtestPositions = mysqlTable("backtest_positions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => backtestSessions.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  quantity: int("quantity").default(0).notNull(),
  avgCost: decimal("avgCost", { precision: 16, scale: 4 }).notNull(),
  totalCost: decimal("totalCost", { precision: 16, scale: 2 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BacktestPosition = typeof backtestPositions.$inferSelect;
export type InsertBacktestPosition = typeof backtestPositions.$inferInsert;

/**
 * Tracked people table (for VIP news flow)
 */
export const trackedPeople = mysqlTable("tracked_people", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  nameZh: varchar("nameZh", { length: 128 }),
  title: varchar("title", { length: 256 }),
  titleZh: varchar("titleZh", { length: 256 }),
  twitterHandle: varchar("twitterHandle", { length: 64 }),
  truthSocialHandle: varchar("truthSocialHandle", { length: 64 }),
  category: mysqlEnum("category", ["政治", "科技", "金融", "商业", "其他"]).default("其他").notNull(),
  avatarEmoji: varchar("avatarEmoji", { length: 10 }).default("👤"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrackedPerson = typeof trackedPeople.$inferSelect;
export type InsertTrackedPerson = typeof trackedPeople.$inferInsert;

/**
 * Social media cache table (for Twitter and Truth Social posts)
 */
export const socialMediaCache = mysqlTable("social_media_cache", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["twitter", "truthsocial"]).notNull(),
  handle: varchar("handle", { length: 64 }).notNull(),
  postId: varchar("postId", { length: 64 }).notNull(),
  content: text("content").notNull(),
  contentZh: text("contentZh"),
  createdAt: timestamp("createdAt").notNull(),
  metrics: text("metrics"),
  url: text("url"),
  media: text("media"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
});

export type SocialMediaCache = typeof socialMediaCache.$inferSelect;
export type InsertSocialMediaCache = typeof socialMediaCache.$inferInsert;

/**
 * Watchlist table (user's favorite stocks)
 */
export const watchlist = mysqlTable("watchlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = typeof watchlist.$inferInsert;
