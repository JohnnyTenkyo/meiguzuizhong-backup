import { getDb } from "./db";
import { socialMediaCache } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getTwitterTweetsByUsername } from "./twitterAdapter";
import { getTruthSocialPosts, isTruthSocialConfigured } from "./truthSocialAdapter";

// 缓存有效期：5 分钟
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Google Translate 免费翻译
 */
async function translateText(text: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('');
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// 需要缓存的账号列表
const ACCOUNTS_TO_CACHE = [
  { platform: 'twitter' as const, handle: '@realDonaldTrump' },
  { platform: 'truthsocial' as const, handle: '@realDonaldTrump' },
];

/**
 * 从缓存获取帖子
 */
export async function getCachedPosts(platform: 'twitter' | 'truthsocial', handle: string) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  
  const cached = await db
    .select()
    .from(socialMediaCache)
    .where(and(
      eq(socialMediaCache.platform, platform),
      eq(socialMediaCache.handle, handle)
    ))
    .orderBy(desc(socialMediaCache.createdAt));
  
  // 检查缓存是否过期
  if (cached.length > 0) {
    const cacheAge = now - new Date(cached[0].cachedAt).getTime();
    if (cacheAge < CACHE_TTL_MS) {
      return cached;
    }
  }
  
  return [];
}

/**
 * 缓存 Twitter 帖子
 */
async function cacheTwitterPosts(handle: string) {
  try {
    console.log(`Fetching Twitter posts for ${handle}...`);
    const tweets = await getTwitterTweetsByUsername(handle.replace('@', ''), 20);
    
    if (tweets.length === 0) {
      console.log(`No Twitter posts found for ${handle}`);
      return;
    }
    
    const db = await getDb();
    if (!db) return;
    
    // 删除旧缓存
    await db.delete(socialMediaCache).where(and(
      eq(socialMediaCache.platform, 'twitter'),
      eq(socialMediaCache.handle, handle)
    ));
    
    // 插入新缓存（带翻译）
    for (const tweet of tweets) {
      const contentZh = await translateText(tweet.text);
      await db.insert(socialMediaCache).values({
        platform: 'twitter',
        handle,
        postId: tweet.id,
        content: tweet.text,
        contentZh,
        createdAt: new Date(tweet.created_at),
        metrics: JSON.stringify({
          likes: tweet.favorite_count || 0,
          retweets: tweet.retweet_count || 0,
          replies: tweet.reply_count || 0,
          quotes: tweet.quote_count || 0,
        }),
      });
    }
    
    console.log(`Successfully cached ${tweets.length} twitter posts for ${handle}`);
  } catch (error) {
    console.error(`Error caching Twitter posts for ${handle}:`, error);
  }
}

/**
 * 缓存 Truth Social 帖子
 */
async function cacheTruthSocialPosts(handle: string) {
  try {
    if (!isTruthSocialConfigured()) {
      console.log('Truth Social not configured, skipping cache');
      return;
    }
    
    console.log(`Fetching Truth Social posts for ${handle}...`);
    const posts = await getTruthSocialPosts(handle.replace('@', ''), 20);
    
    if (posts.length === 0) {
      console.log(`No Truth Social posts found for ${handle}`);
      return;
    }
    
    const db = await getDb();
    if (!db) return;
    
    // 删除旧缓存
    await db.delete(socialMediaCache).where(and(
      eq(socialMediaCache.platform, 'truthsocial'),
      eq(socialMediaCache.handle, handle)
    ));
    
    // 插入新缓存（带翻译）
    for (const post of posts) {
      const contentZh = await translateText(post.text);
      await db.insert(socialMediaCache).values({
        platform: 'truthsocial',
        handle,
        postId: post.id,
        content: post.text,
        contentZh,
        createdAt: new Date(post.created_at),
        metrics: JSON.stringify({
          likes: post.favourites_count || 0,
          retweets: post.reblogs_count || 0,
          replies: post.replies_count || 0,
        }),
      });
    }
    
    console.log(`Successfully cached ${posts.length} truthsocial posts for ${handle}`);
  } catch (error) {
    console.error(`Error caching Truth Social posts for ${handle}:`, error);
  }
}

/**
 * 刷新所有缓存
 */
async function refreshAllCaches() {
  console.log('Starting background cache refresh...');
  
  for (const { platform, handle } of ACCOUNTS_TO_CACHE) {
    if (platform === 'twitter') {
      await cacheTwitterPosts(handle);
    } else if (platform === 'truthsocial') {
      await cacheTruthSocialPosts(handle);
    }
  }
  
  console.log('Background cache refresh completed');
}

/**
 * 启动定时刷新任务
 */
export function startCacheRefreshTask() {
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟
  
  // 立即执行一次
  refreshAllCaches();
  
  // 定时刷新
  setInterval(refreshAllCaches, REFRESH_INTERVAL_MS);
  
  console.log(`Cache refresh task started (interval: ${REFRESH_INTERVAL_MS / 1000}s)`);
}
