import { z } from "zod";
import type { TextContent, ImageContent, FileContent } from "./_core/llm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import https from "https";
import http from "http";
import { getTwitterTweetsByUsername } from "./twitterAdapter";
import { getTruthSocialPosts, isTruthSocialConfigured } from "./truthSocialAdapter";
import { getCachedPosts } from "./socialMediaCacheManager";
// AI 摘要功能已移除（确保网站完全免費）
import { getDb } from "./db";
import { trackedPeople } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ============================================================
// 翻译函数
// ============================================================
async function translateToChineseIfNeeded(text: string): Promise<string> {
  try {
    // 检查是否已经是中文
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return text; // 已经是中文，不需要翻译
    }

    // 使用 LLM 翻译
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following text to Chinese (Simplified). Only return the translated text, nothing else.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    const translated = typeof content === 'string' ? content : text;
    return translated.trim();
  } catch (error) {
    console.error("[Translation] Error translating text:", error);
    return text; // 翻译失败时返回原文
  }
}

// ============================================================
// VIP 人物数据库 - 内置重要人物信息
// ============================================================
interface VIPPerson {
  id: string;
  name: string;
  nameZh: string;
  title: string;
  titleZh: string;
  org: string;
  twitterHandle?: string;
  truthSocialHandle?: string;
  category: "政治" | "科技" | "金融" | "商业";
  relatedTickers?: string[];
  avatarEmoji: string;
}

const VIP_PEOPLE: VIPPerson[] = [
  {
    id: "trump",
    name: "Donald Trump",
    nameZh: "唐纳德·特朗普",
    title: "President of the United States",
    titleZh: "美国总统",
    org: "White House",
    twitterHandle: "realDonaldTrump",
    truthSocialHandle: "realDonaldTrump",
    category: "政治",
    avatarEmoji: "🏛️",
  },
  {
    id: "musk",
    name: "Elon Musk",
    nameZh: "埃隆·马斯克",
    title: "CEO of Tesla & SpaceX, Owner of X",
    titleZh: "特斯拉/SpaceX CEO，X 平台所有者",
    org: "Tesla / SpaceX / X",
    twitterHandle: "elonmusk",
    category: "科技",
    relatedTickers: ["TSLA"],
    avatarEmoji: "🚀",
  },
  {
    id: "jensen",
    name: "Jensen Huang",
    nameZh: "黄仁勋",
    title: "CEO of NVIDIA",
    titleZh: "英伟达 CEO",
    org: "NVIDIA",
    twitterHandle: "nvidia",
    category: "科技",
    relatedTickers: ["NVDA"],
    avatarEmoji: "🎮",
  },
  {
    id: "powell",
    name: "Jerome Powell",
    nameZh: "杰罗姆·鲍威尔",
    title: "Chair of the Federal Reserve",
    titleZh: "美联储主席",
    org: "Federal Reserve",
    category: "金融",
    avatarEmoji: "🏦",
  },
  {
    id: "cook",
    name: "Tim Cook",
    nameZh: "蒂姆·库克",
    title: "CEO of Apple",
    titleZh: "苹果 CEO",
    org: "Apple",
    twitterHandle: "tim_cook",
    category: "科技",
    relatedTickers: ["AAPL"],
    avatarEmoji: "🍎",
  },
  {
    id: "nadella",
    name: "Satya Nadella",
    nameZh: "萨提亚·纳德拉",
    title: "CEO of Microsoft",
    titleZh: "微软 CEO",
    org: "Microsoft",
    twitterHandle: "sataborat",
    category: "科技",
    relatedTickers: ["MSFT"],
    avatarEmoji: "💻",
  },
  {
    id: "zuckerberg",
    name: "Mark Zuckerberg",
    nameZh: "马克·扎克伯格",
    title: "CEO of Meta Platforms",
    titleZh: "Meta 平台 CEO",
    org: "Meta",
    category: "科技",
    relatedTickers: ["META"],
    avatarEmoji: "👤",
  },
  {
    id: "bezos",
    name: "Jeff Bezos",
    nameZh: "杰夫·贝佐斯",
    title: "Executive Chairman of Amazon",
    titleZh: "亚马逊执行董事长",
    org: "Amazon",
    twitterHandle: "JeffBezos",
    category: "商业",
    relatedTickers: ["AMZN"],
    avatarEmoji: "📦",
  },
  {
    id: "pichai",
    name: "Sundar Pichai",
    nameZh: "桑达尔·皮查伊",
    title: "CEO of Alphabet/Google",
    titleZh: "Alphabet/谷歌 CEO",
    org: "Alphabet / Google",
    twitterHandle: "sundarpichai",
    category: "科技",
    relatedTickers: ["GOOGL", "GOOG"],
    avatarEmoji: "🔍",
  },
  {
    id: "altman",
    name: "Sam Altman",
    nameZh: "萨姆·奥特曼",
    title: "CEO of OpenAI",
    titleZh: "OpenAI CEO",
    org: "OpenAI",
    twitterHandle: "sama",
    category: "科技",
    relatedTickers: ["MSFT"],
    avatarEmoji: "🤖",
  },
  {
    id: "nejatian",
    name: "Kaz Nejatian",
    nameZh: "卡兹·内贾蒂安",
    title: "CEO of Shopify",
    titleZh: "Shopify CEO",
    org: "Shopify",
    category: "科技",
    relatedTickers: ["SHOP"],
    avatarEmoji: "🛒",
  },
  {
    id: "jassy",
    name: "Andy Jassy",
    nameZh: "安迪·贾西",
    title: "CEO of Amazon",
    titleZh: "亚马逊 CEO",
    org: "Amazon",
    category: "科技",
    relatedTickers: ["AMZN"],
    avatarEmoji: "☁️",
  },
  {
    id: "dimon",
    name: "Jamie Dimon",
    nameZh: "杰米·戴蒙",
    title: "CEO of JPMorgan Chase",
    titleZh: "摩根大通 CEO",
    org: "JPMorgan Chase",
    category: "金融",
    relatedTickers: ["JPM"],
    avatarEmoji: "🏦",
  },
  {
    id: "buffett",
    name: "Warren Buffett",
    nameZh: "沃伦·巴菲特",
    title: "Chairman of Berkshire Hathaway",
    titleZh: "伯克希尔·哈撒韦董事长",
    org: "Berkshire Hathaway",
    category: "金融",
    relatedTickers: ["BRK.B", "BRK.A"],
    avatarEmoji: "🎩",
  },
  {
    id: "su",
    name: "Lisa Su",
    nameZh: "苏姿丰",
    title: "CEO of AMD",
    titleZh: "AMD CEO",
    org: "AMD",
    category: "科技",
    relatedTickers: ["AMD"],
    avatarEmoji: "⚡",
  },
  {
    id: "warsh",
    name: "Kevin Warsh",
    nameZh: "凯文·沃什",
    title: "Federal Reserve Chair Nominee",
    titleZh: "美联储主席提名者",
    org: "Federal Reserve (Nominee)",
    twitterHandle: "KevinWarsh",
    truthSocialHandle: "KevinWarsh",
    category: "金融",
    avatarEmoji: "🏦",
  },
  {
    id: "yellen",
    name: "Janet Yellen",
    nameZh: "珍妮特·耶伦",
    title: "U.S. Secretary of the Treasury",
    titleZh: "美国财政部长",
    org: "U.S. Department of the Treasury",
    category: "金融",
    avatarEmoji: "💵",
  },
  {
    id: "lagarde",
    name: "Christine Lagarde",
    nameZh: "克里斯蒂娜·拉加德",
    title: "President of the European Central Bank",
    titleZh: "欧洲央行行长",
    org: "European Central Bank",
    category: "金融",
    avatarEmoji: "🇪🇺",
  },
  {
    id: "dalio",
    name: "Ray Dalio",
    nameZh: "瑞·达利欧",
    title: "Founder of Bridgewater Associates",
    titleZh: "桥水基金创始人",
    org: "Bridgewater Associates",
    twitterHandle: "RayDalio",
    category: "金融",
    avatarEmoji: "📊",
  },
  {
    id: "ackman",
    name: "Bill Ackman",
    nameZh: "比尔·阿克曼",
    title: "CEO of Pershing Square Capital",
    titleZh: "潘兴广场资本 CEO",
    org: "Pershing Square Capital",
    twitterHandle: "BillAckman",
    category: "金融",
    relatedTickers: ["PSH"],
    avatarEmoji: "💼",
  },
];

// ============================================================
// 股票代码 → CEO/关键人物 映射表
// ============================================================
const TICKER_TO_PEOPLE: Record<string, string[]> = {};
VIP_PEOPLE.forEach((p) => {
  if (p.relatedTickers) {
    p.relatedTickers.forEach((ticker) => {
      if (!TICKER_TO_PEOPLE[ticker]) TICKER_TO_PEOPLE[ticker] = [];
      TICKER_TO_PEOPLE[ticker].push(p.id);
    });
  }
});

// 额外补充一些常见股票的关键人物
const EXTRA_TICKER_MAP: Record<string, { name: string; nameZh: string; title: string; titleZh: string; twitterHandle?: string; truthSocialHandle?: string; avatarEmoji: string }[]> = {
  "OPEN": [{ name: "Kaz Nejatian", nameZh: "卡兹·内贾蒂安", title: "CEO of Opendoor Technologies", titleZh: "Opendoor Technologies CEO", twitterHandle: "nejatian", avatarEmoji: "🏠" }],
  "PLTR": [{ name: "Alex Karp", nameZh: "亚历克斯·卡普", title: "CEO of Palantir Technologies", titleZh: "Palantir Technologies CEO", avatarEmoji: "🔮" }],
  "CRM": [{ name: "Marc Benioff", nameZh: "马克·贝尼奥夫", title: "CEO of Salesforce", titleZh: "Salesforce CEO", twitterHandle: "Benioff", avatarEmoji: "☁️" }],
  "NFLX": [{ name: "Ted Sarandos", nameZh: "泰德·萨兰多斯", title: "Co-CEO of Netflix", titleZh: "Netflix 联合CEO", avatarEmoji: "🎬" }],
  "DIS": [{ name: "Bob Iger", nameZh: "鲍勃·艾格", title: "CEO of The Walt Disney Company", titleZh: "迪士尼 CEO", avatarEmoji: "🏰" }],
  "BA": [{ name: "Kelly Ortberg", nameZh: "凯利·奥特伯格", title: "CEO of Boeing", titleZh: "波音 CEO", avatarEmoji: "✈️" }],
  "COIN": [{ name: "Brian Armstrong", nameZh: "布莱恩·阿姆斯特朗", title: "CEO of Coinbase", titleZh: "Coinbase CEO", twitterHandle: "brian_armstrong", avatarEmoji: "🪙" }],
  "SQ": [{ name: "Jack Dorsey", nameZh: "杰克·多尔西", title: "CEO of Block", titleZh: "Block CEO", twitterHandle: "jack", avatarEmoji: "💳" }],
  "UBER": [{ name: "Dara Khosrowshahi", nameZh: "达拉·科斯罗萨西", title: "CEO of Uber", titleZh: "Uber CEO", avatarEmoji: "🚗" }],
  "INTC": [{ name: "Lip-Bu Tan", nameZh: "陈立武", title: "CEO of Intel", titleZh: "英特尔 CEO", avatarEmoji: "🔧" }],
  "TSM": [{ name: "C.C. Wei", nameZh: "魏哲家", title: "CEO of TSMC", titleZh: "台积电 CEO", avatarEmoji: "🏭" }],
  "BABA": [{ name: "Eddie Wu", nameZh: "吴泳铭", title: "CEO of Alibaba Group", titleZh: "阿里巴巴集团 CEO", avatarEmoji: "🛍️" }],
};

// ============================================================
// Google News RSS 解析
// ============================================================
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

interface NewsItem {
  title: string;
  titleZh?: string;
  link: string;
  pubDate: string;
  source: string;
  type: "news" | "social";
}

function parseGoogleNewsRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

    if (titleMatch) {
      const title = titleMatch[1].replace(/ - .*$/, "").trim();
      const source = sourceMatch ? sourceMatch[1].trim() : "";
      const isSocial = /twitter|tweet|X post|X says|posted on X|truth social|social media/i.test(title + " " + source);

      items.push({
        title,
        link: linkMatch ? linkMatch[1].trim() : "",
        pubDate: dateMatch ? dateMatch[1].trim() : "",
        source,
        type: isSocial ? "social" : "news",
      });
    }
  }
  return items;
}

// ============================================================
// Google Translate 免费翻译
// ============================================================
async function translateText(text: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`;
    const resp = await fetchUrl(url);
    const data = JSON.parse(resp);
    
    // 检查数据格式
    if (data && Array.isArray(data[0])) {
      const translated = data[0].map((seg: any[]) => {
        if (Array.isArray(seg) && seg[0]) {
          return seg[0];
        }
        return '';
      }).join("");
      
      if (translated) {
        return translated;
      }
    }
    
    return text;
  } catch (error) {
    console.warn('[Translation] Error translating text:', error);
    return text;
  }
}

// ============================================================
// tRPC 路由
// ============================================================
export const newsflowRouter = router({
  // 获取 VIP 人物列表
  getVIPList: publicProcedure.query(() => {
    return VIP_PEOPLE.map((p) => ({
      id: p.id,
      name: p.name,
      nameZh: p.nameZh,
      title: p.title,
      titleZh: p.titleZh,
      org: p.org,
      category: p.category,
      avatarEmoji: p.avatarEmoji,
      twitterHandle: p.twitterHandle,
      truthSocialHandle: p.truthSocialHandle,
      relatedTickers: p.relatedTickers || [],
    }));
  }),

  // 根据股票代码获取关联的关键人物
  getPeopleByTicker: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(({ input }) => {
      const ticker = input.ticker.toUpperCase();
      const vipIds = TICKER_TO_PEOPLE[ticker] || [];
      const vipResults = vipIds.map((id) => {
        const p = VIP_PEOPLE.find((v) => v.id === id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          nameZh: p.nameZh,
          title: p.title,
          titleZh: p.titleZh,
          org: p.org,
          avatarEmoji: p.avatarEmoji,
          twitterHandle: p.twitterHandle,
        };
      }).filter(Boolean);

      const extraResults = (EXTRA_TICKER_MAP[ticker] || []).map((e) => ({
        id: e.name.toLowerCase().replace(/\s+/g, "_"),
        name: e.name,
        nameZh: e.nameZh,
        title: e.title,
        titleZh: e.titleZh,
        org: "",
        avatarEmoji: e.avatarEmoji,
        twitterHandle: e.twitterHandle,
      }));

      return [...vipResults, ...extraResults];
    }),

  // 获取人物新闻信息流
  getPersonNews: publicProcedure
    .input(z.object({
      personName: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      try {
        const query = encodeURIComponent(input.personName);
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        const xml = await fetchUrl(url);
        let items = parseGoogleNewsRSS(xml);
        items = items.slice(0, input.limit);

        // 翻译标题（批量）
        const translated = await Promise.all(
          items.map(async (item) => {
            const titleZh = await translateText(item.title);
            return { ...item, titleZh };
          })
        );

        return translated;
      } catch (err) {
        console.error("Error fetching person news:", err);
        return [];
      }
    }),

  // 获取人物 Twitter 动态（直接通过 Twitter API）
  getPersonTwitter: publicProcedure
    .input(z.object({
      twitterHandle: z.string(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      try {
        if (!input.twitterHandle) {
          return [];
        }

        // 直接从 Twitter API 获取推文
        const tweets = await getTwitterTweetsByUsername(input.twitterHandle, input.limit);
        
        // 检查是否有效数据
        if (!Array.isArray(tweets) || tweets.length === 0) {
          return [];
        }
        
        // 转换为统一的 NewsItem 格式
        const items = tweets.map((tweet) => ({
          title: tweet.text,
          titleZh: tweet.text, // 先设为原文
          link: `https://x.com/${input.twitterHandle}/status/${tweet.id}`,
          pubDate: tweet.created_at,
          source: "X (Twitter)",
          type: "social" as const,
          isRetweet: tweet.is_retweet,
          isReply: tweet.is_reply,
          engagement: {
            likes: tweet.favorite_count,
            retweets: tweet.retweet_count,
            replies: tweet.reply_count,
            quotes: tweet.quote_count,
          },
        }));

        // 先返回原文，后台程序异步翻译
        setImmediate(async () => {
          try {
            const translatedItems = await Promise.all(
              items.map(async (item) => {
                const titleZh = await translateToChineseIfNeeded(item.title);
                return {
                  ...item,
                  titleZh: titleZh !== item.title ? titleZh : item.title,
                };
              })
            );
            console.log('[newsflow] Translated', translatedItems.length, 'tweets');
          } catch (err) {
            console.error('[newsflow] Translation error:', err);
          }
        });
        
        return items;
      } catch (err) {
        console.error("Error fetching Twitter timeline:", err);
        return [];
      }
    }),

  // 获取人物原创 Twitter 动态（过滤转发和评论）
  getPersonOriginalTweets: publicProcedure
    .input(z.object({
      twitterHandle: z.string(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      try {
        if (!input.twitterHandle) {
          return [];
        }

        // 获取所有推文
        const tweets = await getTwitterTweetsByUsername(input.twitterHandle, input.limit * 2);
        
        // 检查是否有效数据
        if (!Array.isArray(tweets) || tweets.length === 0) {
          return [];
        }
        
        // 过滤出原创推文（非转发且非评论）
        const originalTweets = tweets.filter(tweet => !tweet.is_retweet && !tweet.is_reply);
        
        // 限制数量
        const limited = originalTweets.slice(0, input.limit);
        
        // 转换为统一的 NewsItem 格式
        const items = limited.map((tweet) => ({
          title: tweet.text,
          titleZh: tweet.text, // 先设为原文
          link: `https://x.com/${input.twitterHandle}/status/${tweet.id}`,
          pubDate: tweet.created_at,
          source: "X (Twitter)",
          type: "social" as const,
          isRetweet: false,
          isReply: false,
          engagement: {
            likes: tweet.favorite_count,
            retweets: tweet.retweet_count,
            replies: tweet.reply_count,
            quotes: tweet.quote_count,
          },
        }));

        // 先返回原文，后台程序异步翻译
        // 这样前端可以立即显示推文，而不是等待翻译完成
        
        // 后台程序异步翻译（不阻塞返回）
        setImmediate(async () => {
          try {
            const translatedItems = await Promise.all(
              items.map(async (item) => {
                const titleZh = await translateToChineseIfNeeded(item.title);
                return {
                  ...item,
                  titleZh: titleZh !== item.title ? titleZh : item.title,
                };
              })
            );
            console.log('[newsflow] Translated', translatedItems.length, 'tweets');
          } catch (err) {
            console.error('[newsflow] Translation error:', err);
          }
        });

        return items;
      } catch (err) {
        console.error("Error fetching original tweets:", err);
        return [];
      }
    }),

  // 获取人物 Truth Social 动态
  getPersonTruthSocial: publicProcedure
    .input(z.object({
      truthSocialHandle: z.string(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      try {
        if (!input.truthSocialHandle || !isTruthSocialConfigured()) {
          return [];
        }

        // 尝试从缓存获取
        const cached = await getCachedPosts('truthsocial', `@${input.truthSocialHandle}`);
        if (cached.length > 0) {
          console.log(`Using cached truthsocial posts for @${input.truthSocialHandle} (age: ${Math.floor((Date.now() - new Date(cached[0].cachedAt).getTime()) / 1000)}s)`);
                const items = cached.map(c => {
            const metrics = c.metrics ? JSON.parse(c.metrics) : {};
            return {
              title: c.content,
              titleZh: c.contentZh || c.content,
              link: c.url || `https://truthsocial.com/@${input.truthSocialHandle}/posts/${c.postId}`,
              pubDate: c.createdAt,
              source: "Truth Social",
              type: "social" as const,
              engagement: {
                likes: metrics.likes || 0,
                retweets: metrics.retweets || 0,
                replies: metrics.replies || 0,
              },
            };
          });
          
          return items;
        }

        // 缓存未命中，直接获取（但不会触发，因为后台刷新任务会定期更新）
        const posts = await getTruthSocialPosts(input.truthSocialHandle, input.limit);
        
        const items = posts.map((post) => ({
          title: post.text,
          titleZh: post.text, // 先设为原文，稍后翻译
          link: post.url,
          pubDate: post.created_at,
          source: "Truth Social",
          type: "social" as const,
          engagement: {
            likes: post.favourites_count || 0,
            retweets: post.reblogs_count || 0,
            replies: post.replies_count || 0,
          },
        }));

        // 翻译所有帖子
        const translated = await Promise.all(
          items.map(async (item) => {
            const titleZh = await translateText(item.title);
            return { ...item, titleZh };
          })
        );

        return translated;
      } catch (err) {
        console.error("Error fetching Truth Social posts:", err);
        return [];
      }
    }),

  // 获取人物社交媒体动态（通过 Google News 搜索间接获取，作为备用）
  getPersonSocial: publicProcedure
    .input(z.object({
      personName: z.string(),
      twitterHandle: z.string().optional(),
      limit: z.number().optional().default(8),
    }))
    .query(async ({ input }) => {
      try {
        // 搜索该人物在社交媒体上的动态，使用多个查询词增加覆盖范围
        const queries = [
          `${input.personName} says statement`,
          `${input.personName} tweet post X`,
          input.twitterHandle ? `@${input.twitterHandle} twitter` : null,
          `${input.personName} announced posted`,
        ].filter(Boolean) as string[];

        const allItems: NewsItem[] = [];
        for (const q of queries) {
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
          try {
            const xml = await fetchUrl(url);
            const items = parseGoogleNewsRSS(xml);
            allItems.push(...items);
          } catch {
            // skip
          }
        }

        // 去重
        const seen = new Set<string>();
        const unique = allItems.filter((item) => {
          if (seen.has(item.title)) return false;
          seen.add(item.title);
          return true;
        });

        const limited = unique.slice(0, input.limit);

        // 翻译
        const translated = await Promise.all(
          limited.map(async (item) => {
            const titleZh = await translateText(item.title);
            return { ...item, titleZh, type: "social" as const };
          })
        );

        return translated;
      } catch (err) {
        console.error("Error fetching person social:", err);
        return [];
      }
    }),

  // 获取人物综合信息流（新闻 + 社交媒体混合）
  getPersonFeed: publicProcedure
    .input(z.object({
      personName: z.string(),
      twitterHandle: z.string().optional(),
      truthSocialHandle: z.string().optional(),
      limit: z.number().optional().default(15),
    }))
    .query(async ({ input }) => {
      try {
        // 获取新闻
        const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(input.personName + " stock market OR economy OR company")}&hl=en-US&gl=US&ceid=US:en`;
        const newsXml = await fetchUrl(newsUrl);
        let newsItems = parseGoogleNewsRSS(newsXml);

        // 获取社交媒体相关
        let socialItems: NewsItem[] = [];
        
        // 优先使用 Truth Social API （如果配置了）
        if (input.truthSocialHandle && isTruthSocialConfigured()) {
          try {
            const posts = await getTruthSocialPosts(input.truthSocialHandle, 10);
            const truthItems = posts.map((post) => ({
              title: post.text,
              titleZh: post.text,
              link: post.url,
              pubDate: post.created_at,
              source: "Truth Social",
              type: "social" as const,
            }));
            socialItems.push(...truthItems);
          } catch (err) {
            console.error("Error fetching Truth Social posts:", err);
          }
        }
        
        // 使用 Twitter API 获取实时推文
        if (input.twitterHandle) {
          try {
            const tweets = await getTwitterTweetsByUsername(input.twitterHandle, 10);
            const twitterItems = tweets.map((tweet) => ({
              title: tweet.text,
              titleZh: tweet.text,
              link: `https://x.com/${input.twitterHandle}/status/${tweet.id}`,
              pubDate: tweet.created_at,
              source: "X (Twitter)",
              type: "social" as const,
            }));
            socialItems.push(...twitterItems);
          } catch (err) {
            console.error("Error fetching Twitter timeline:", err);
          }
        }
        
        // 如果 Twitter API 获取失败或没有 twitterHandle，使用 Google News 作为后备
        if (socialItems.length === 0) {
          const socialQueries = [
            `${input.personName} says OR statement OR announced OR posted`,
            input.twitterHandle ? `@${input.twitterHandle} OR "${input.personName}" X post` : null,
          ].filter(Boolean) as string[];
          
          for (const query of socialQueries) {
            try {
              const socialUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
              const socialXml = await fetchUrl(socialUrl);
              const items = parseGoogleNewsRSS(socialXml).map((item) => ({
                ...item,
                type: "social" as const,
              }));
              socialItems.push(...items);
            } catch {
              // skip
            }
          }
        }

        // 合并并去重
        const allItems = [...newsItems, ...socialItems];
        const seen = new Set<string>();
        const unique = allItems.filter((item) => {
          const key = item.title.substring(0, 50);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // 按日期排序
        unique.sort((a, b) => {
          const da = new Date(a.pubDate).getTime() || 0;
          const db = new Date(b.pubDate).getTime() || 0;
          return db - da;
        });

        const limited = unique.slice(0, input.limit);

        // 翻译标题
        const translated = await Promise.all(
          limited.map(async (item) => {
            const titleZh = await translateText(item.title);
            return { ...item, titleZh };
          })
        );

        return translated;
      } catch (err) {
        console.error("Error fetching person feed:", err);
        return [];
      }
    }),

  // 根据收藏的股票列表获取所有关联人物的信息流
  getWatchlistFeed: publicProcedure
    .input(z.object({
      tickers: z.array(z.string()),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const personSet = new Map<string, { name: string; nameZh: string; title: string; titleZh: string; avatarEmoji: string; ticker: string; twitterHandle?: string; truthSocialHandle?: string }>();

      for (const ticker of input.tickers) {
        const t = ticker.toUpperCase();
        // 从 VIP 列表查找
        const vipIds = TICKER_TO_PEOPLE[t] || [];
        for (const id of vipIds) {
          const p = VIP_PEOPLE.find((v) => v.id === id);
          if (p && !personSet.has(p.name)) {
            personSet.set(p.name, {
              name: p.name,
              nameZh: p.nameZh,
              title: p.title,
              titleZh: p.titleZh,
              avatarEmoji: p.avatarEmoji,
              ticker: t,
              twitterHandle: p.twitterHandle,
              truthSocialHandle: p.truthSocialHandle,
            });
          }
        }
        // 从额外映射查找
        const extras = EXTRA_TICKER_MAP[t] || [];
        for (const e of extras) {
          if (!personSet.has(e.name)) {
            personSet.set(e.name, {
              name: e.name,
              nameZh: e.nameZh,
              title: e.title,
              titleZh: e.titleZh,
              avatarEmoji: e.avatarEmoji,
              ticker: t,
              twitterHandle: e.twitterHandle,
              truthSocialHandle: e.truthSocialHandle,
            });
          }
        }
      }

      const people = Array.from(personSet.values());
      return people;
    }),

  // ============================================================
  // 自定义追踪人物 API
  // ============================================================

  // 获取用户的自定义追踪人物列表
  getTrackedPeople: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) return [];
    const people = await db.select().from(trackedPeople).where(eq(trackedPeople.userId, userId));
    return people;
  }),

  // 添加自定义追踪人物
  addTrackedPerson: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      nameZh: z.string().optional(),
      title: z.string().optional(),
      titleZh: z.string().optional(),
      twitterHandle: z.string().optional(),
      truthSocialHandle: z.string().optional(),
      category: z.enum(["政治", "科技", "金融", "商业", "其他"]).default("其他"),
      avatarEmoji: z.string().default("👤"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [person] = await db.insert(trackedPeople).values({
        userId,
        name: input.name,
        nameZh: input.nameZh || input.name,
        title: input.title || "",
        titleZh: input.titleZh || input.title || "",
        twitterHandle: input.twitterHandle,
        truthSocialHandle: input.truthSocialHandle,
        category: input.category,
        avatarEmoji: input.avatarEmoji,
      });
      return { success: true, id: person.insertId };
    }),

  // 删除自定义追踪人物
  deleteTrackedPerson: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(trackedPeople).where(
        and(
          eq(trackedPeople.id, input.id),
          eq(trackedPeople.userId, userId)
        )
      );
      return { success: true };
    }),

  // 更新自定义追踪人物
  updateTrackedPerson: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameZh: z.string().optional(),
      title: z.string().optional(),
      titleZh: z.string().optional(),
      twitterHandle: z.string().optional(),
      truthSocialHandle: z.string().optional(),
      category: z.enum(["政治", "科技", "金融", "商业", "其他"]).optional(),
      avatarEmoji: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { id, ...updates } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(trackedPeople)
        .set(updates)
        .where(
          and(
            eq(trackedPeople.id, id),
            eq(trackedPeople.userId, userId)
          )
        );
      return { success: true };
    }),

  // ============================================================
  // AI 智能摘要 API
  // ============================================================

  // AI 摘要功能已移除（确保网站完全免费）
});
