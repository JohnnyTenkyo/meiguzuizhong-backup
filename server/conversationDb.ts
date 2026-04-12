/**
 * 对话历史数据库查询助手
 */

import { getDb } from "./db";
import {
  aiConversationThreads,
  aiConversationMessages,
  type AIConversationThread,
  type AIConversationMessage,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * 创建新对话线程
 */
export async function createConversationThread(
  userId: number,
  title: string,
  agentType: "stock" | "foci" = "stock"
): Promise<AIConversationThread> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(aiConversationThreads)
    .values({
      userId,
      title,
      agentType,
      status: "active",
    });

  // 获取刚插入的记录
  const result = await db
    .select()
    .from(aiConversationThreads)
    .where(eq(aiConversationThreads.userId, userId))
    .orderBy(desc(aiConversationThreads.createdAt))
    .limit(1);

  return result[0];
}

/**
 * 获取用户的所有对话线程
 */
export async function getUserConversationThreads(
  userId: number,
  agentType?: "stock" | "foci"
): Promise<AIConversationThread[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db
    .select()
    .from(aiConversationThreads)
    .where(eq(aiConversationThreads.userId, userId)) as any;

  if (agentType) {
    query = query.where(eq(aiConversationThreads.agentType, agentType));
  }

  return query.orderBy(desc(aiConversationThreads.updatedAt));
}

/**
 * 获取单个对话线程
 */
export async function getConversationThread(
  threadId: number
): Promise<AIConversationThread | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(aiConversationThreads)
    .where(eq(aiConversationThreads.id, threadId));

  return result[0] || null;
}

/**
 * 更新对话线程标题
 */
export async function updateConversationThreadTitle(
  threadId: number,
  title: string
): Promise<AIConversationThread> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(aiConversationThreads)
    .set({ title, updatedAt: new Date() })
    .where(eq(aiConversationThreads.id, threadId));

  const result = await db
    .select()
    .from(aiConversationThreads)
    .where(eq(aiConversationThreads.id, threadId));

  return result[0];
}

/**
 * 归档对话线程
 */
export async function archiveConversationThread(
  threadId: number
): Promise<AIConversationThread> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(aiConversationThreads)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(aiConversationThreads.id, threadId));

  const result = await db
    .select()
    .from(aiConversationThreads)
    .where(eq(aiConversationThreads.id, threadId));

  return result[0];
}

/**
 * 保存对话消息
 */
export async function saveConversationMessage(
  threadId: number,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<AIConversationMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(aiConversationMessages)
    .values({
      threadId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

  // 更新线程的 updatedAt
  await db
    .update(aiConversationThreads)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversationThreads.id, threadId));

  // 获取刚插入的消息
  const result = await db
    .select()
    .from(aiConversationMessages)
    .orderBy(desc(aiConversationMessages.createdAt))
    .limit(1);

  return result[0]!;
}

/**
 * 获取对话线程的所有消息
 */
export async function getConversationMessages(
  threadId: number,
  limit: number = 100,
  offset: number = 0
): Promise<AIConversationMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(aiConversationMessages)
    .where(eq(aiConversationMessages.threadId, threadId))
    .orderBy(aiConversationMessages.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * 获取对话线程的最后 N 条消息
 */
export async function getLatestConversationMessages(
  threadId: number,
  count: number = 20
): Promise<AIConversationMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(aiConversationMessages)
    .where(eq(aiConversationMessages.threadId, threadId))
    .orderBy(desc(aiConversationMessages.createdAt))
    .limit(count);

  // 反转顺序，使最新的消息在最后
  return messages.reverse();
}

/**
 * 删除对话线程（级联删除消息）
 */
export async function deleteConversationThread(threadId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(aiConversationThreads)
    .where(eq(aiConversationThreads.id, threadId));
}

/**
 * 获取对话统计信息
 */
export async function getConversationStats(
  threadId: number
): Promise<{
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(aiConversationMessages)
    .where(eq(aiConversationMessages.threadId, threadId));

  return {
    messageCount: messages.length,
    userMessageCount: messages.filter(
      (m: AIConversationMessage) => m.role === "user"
    ).length,
    assistantMessageCount: messages.filter(
      (m: AIConversationMessage) => m.role === "assistant"
    ).length,
  };
}
