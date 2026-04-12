import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createConversationThread,
  getUserConversationThreads,
  getConversationThread,
  updateConversationThreadTitle,
  archiveConversationThread,
  saveConversationMessage,
  getConversationMessages,
  getLatestConversationMessages,
  getConversationStats,
  deleteConversationThread,
} from "./conversationDb";
import * as conversationDb from "./conversationDb";

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
}));

describe("Conversation Management", () => {
  describe("createConversationThread", () => {
    it("应该创建新的对话线程", async () => {
      const thread = await createConversationThread(1, "Test Thread", "stock");
      expect(thread).toBeDefined();
      expect(thread.userId).toBe(1);
      expect(thread.title).toBe("Test Thread");
      expect(thread.agentType).toBe("stock");
      expect(thread.status).toBe("active");
    });

    it("应该使用默认的 agentType", async () => {
      const thread = await createConversationThread(1, "Test Thread");
      expect(thread.agentType).toBe("stock");
    });

    it("应该支持 foci 类型", async () => {
      const thread = await createConversationThread(1, "Foci Thread", "foci");
      expect(thread.agentType).toBe("foci");
    });

    it("应该在数据库不可用时抛出错误", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null);

      await expect(
        createConversationThread(1, "Test", "stock")
      ).rejects.toThrow("Database not available");
    });
  });

  describe("getUserConversationThreads", () => {
    it("应该获取用户的所有对话线程", async () => {
      const threads = await getUserConversationThreads(1);
      expect(Array.isArray(threads)).toBe(true);
    });

    it("应该按 updatedAt 倒序排列", async () => {
      const threads = await getUserConversationThreads(1);
      if (threads.length > 1) {
        for (let i = 1; i < threads.length; i++) {
          expect(threads[i - 1].updatedAt >= threads[i].updatedAt).toBe(true);
        }
      }
    });

    it("应该支持按 agentType 过滤", async () => {
      const threads = await getUserConversationThreads(1, "stock");
      threads.forEach((t) => {
        expect(t.agentType).toBe("stock");
      });
    });
  });

  describe("getConversationThread", () => {
    it("应该获取单个对话线程", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const fetched = await getConversationThread(thread.id);
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(thread.id);
    });

    it("不存在的线程应该返回 null", async () => {
      const thread = await getConversationThread(99999);
      expect(thread).toBeNull();
    });
  });

  describe("updateConversationThreadTitle", () => {
    it("应该更新对话线程标题", async () => {
      const thread = await createConversationThread(1, "Old Title", "stock");
      const updated = await updateConversationThreadTitle(
        thread.id,
        "New Title"
      );
      expect(updated.title).toBe("New Title");
    });

    it("应该更新 updatedAt", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const oldTime = thread.updatedAt;
      const updated = await updateConversationThreadTitle(
        thread.id,
        "New Title"
      );
      expect(updated.updatedAt >= oldTime).toBe(true);
    });
  });

  describe("archiveConversationThread", () => {
    it("应该将对话线程归档", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const archived = await archiveConversationThread(thread.id);
      expect(archived.status).toBe("archived");
    });

    it("应该保持其他字段不变", async () => {
      const thread = await createConversationThread(1, "Test Title", "stock");
      const archived = await archiveConversationThread(thread.id);
      expect(archived.title).toBe(thread.title);
      expect(archived.userId).toBe(thread.userId);
    });
  });

  describe("saveConversationMessage", () => {
    it("应该保存用户消息", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const message = await saveConversationMessage(
        thread.id,
        "user",
        "Hello AI"
      );
      expect(message.role).toBe("user");
      expect(message.content).toBe("Hello AI");
      expect(message.threadId).toBe(thread.id);
    });

    it("应该保存助手消息", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const message = await saveConversationMessage(
        thread.id,
        "assistant",
        "Hello user"
      );
      expect(message.role).toBe("assistant");
      expect(message.content).toBe("Hello user");
    });

    it("应该支持元数据", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const metadata = { attachments: ["file.pdf"], context: "stock_analysis" };
      const message = await saveConversationMessage(
        thread.id,
        "user",
        "Analyze this",
        metadata
      );
      expect(message.metadata).toBeDefined();
    });

    it("应该更新线程的 updatedAt", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const oldTime = thread.updatedAt;
      await saveConversationMessage(thread.id, "user", "Message");
      const updated = await getConversationThread(thread.id);
      expect(updated?.updatedAt >= oldTime).toBe(true);
    });
  });

  describe("getConversationMessages", () => {
    it("应该获取对话消息", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      await saveConversationMessage(thread.id, "user", "Message 1");
      await saveConversationMessage(thread.id, "assistant", "Response 1");

      const messages = await getConversationMessages(thread.id);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it("应该支持分页", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      for (let i = 0; i < 5; i++) {
        await saveConversationMessage(thread.id, "user", `Message ${i}`);
      }

      const page1 = await getConversationMessages(thread.id, 2, 0);
      const page2 = await getConversationMessages(thread.id, 2, 2);

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
    });

    it("应该按时间排序", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      await saveConversationMessage(thread.id, "user", "First");
      await saveConversationMessage(thread.id, "user", "Second");

      const messages = await getConversationMessages(thread.id);
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].createdAt >= messages[i - 1].createdAt).toBe(true);
      }
    });
  });

  describe("getLatestConversationMessages", () => {
    it("应该获取最后 N 条消息", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      for (let i = 0; i < 10; i++) {
        await saveConversationMessage(thread.id, "user", `Message ${i}`);
      }

      const latest = await getLatestConversationMessages(thread.id, 5);
      expect(latest.length).toBeLessThanOrEqual(5);
    });

    it("应该按时间顺序排列", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      await saveConversationMessage(thread.id, "user", "First");
      await saveConversationMessage(thread.id, "user", "Second");

      const latest = await getLatestConversationMessages(thread.id, 10);
      for (let i = 1; i < latest.length; i++) {
        expect(latest[i].createdAt >= latest[i - 1].createdAt).toBe(true);
      }
    });
  });

  describe("getConversationStats", () => {
    it("应该计算对话统计", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      await saveConversationMessage(thread.id, "user", "Q1");
      await saveConversationMessage(thread.id, "assistant", "A1");
      await saveConversationMessage(thread.id, "user", "Q2");
      await saveConversationMessage(thread.id, "assistant", "A2");

      const stats = await getConversationStats(thread.id);
      expect(stats.messageCount).toBe(4);
      expect(stats.userMessageCount).toBe(2);
      expect(stats.assistantMessageCount).toBe(2);
    });

    it("空对话应该返回 0", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      const stats = await getConversationStats(thread.id);
      expect(stats.messageCount).toBe(0);
      expect(stats.userMessageCount).toBe(0);
      expect(stats.assistantMessageCount).toBe(0);
    });
  });

  describe("deleteConversationThread", () => {
    it("应该删除对话线程及其消息", async () => {
      const thread = await createConversationThread(1, "Test", "stock");
      await saveConversationMessage(thread.id, "user", "Message");
      await deleteConversationThread(thread.id);

      const deleted = await getConversationThread(thread.id);
      expect(deleted).toBeNull();
    });
  });
});
