/**
 * Twitter RSS Adapter - 使用 RSS 源获取推文（备用方案）
 * 通过 Nitter 的 RSS 源获取推文，无需认证
 */
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'content'],
    ],
  },
});

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  quote_count: number;
  is_retweet: boolean;
  is_reply: boolean;
  media?: Array<{
    type: string;
    url: string;
  }>;
}

/**
 * 通过 RSS 源获取推文
 * 使用 Nitter 的 RSS 源（无需认证）
 */
export async function getTwitterTweetsByUsernameRss(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter RSS] Fetching ${count} tweets for @${username}`);
    
    // 使用 Nitter 的 RSS 源
    // Nitter 提供了多个实例，我们尝试主要实例
    const nitterInstances = [
      `https://nitter.net/${username}/rss`,
      `https://nitter.poast.org/${username}/rss`,
      `https://nitter.privacydev.net/${username}/rss`,
    ];
    
    let feed = null;
    let lastError: any = null;
    
    // 尝试多个 Nitter 实例
    for (const rssUrl of nitterInstances) {
      try {
        console.log(`[Twitter RSS] Trying ${rssUrl}`);
        feed = await parser.parseURL(rssUrl);
        console.log(`[Twitter RSS] Successfully fetched from ${rssUrl}`);
        break;
      } catch (error: any) {
        console.warn(`[Twitter RSS] Failed to fetch from ${rssUrl}:`, error?.message);
        lastError = error;
        continue;
      }
    }
    
    if (!feed || !feed.items) {
      console.warn(`[Twitter RSS] No tweets found for @${username}`);
      if (lastError) {
        console.error(`[Twitter RSS] Last error:`, lastError?.message);
      }
      return [];
    }
    
    const tweets: TwitterTweet[] = [];
    
    for (const item of feed.items) {
      try {
        if (!item.title || !item.content) {
          continue;
        }
        
        // 从 RSS 项目中提取推文信息
        // RSS 格式: <title>@username: tweet text</title>
        const titleParts = item.title.split(': ');
        let tweetText = item.title;
        
        if (titleParts.length > 1) {
          tweetText = titleParts.slice(1).join(': ');
        }
        
        // 检查是否为转推
        const isRetweet = tweetText.startsWith('RT @');
        
        // 从 content 中提取更多信息
        const content = item.content || '';
        
        // 提取媒体 URL（如果有）
        const mediaUrls: string[] = [];
        const mediaRegex = /https:\/\/[^\s"<>]+\.(jpg|jpeg|png|gif|webp)/gi;
        let mediaMatch;
        while ((mediaMatch = mediaRegex.exec(content)) !== null) {
          mediaUrls.push(mediaMatch[0]);
        }
        
        const tweet: TwitterTweet = {
          id: item.guid || item.link || `${username}-${Date.now()}`,
          text: tweetText,
          created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          retweet_count: 0, // RSS 不提供这些数据
          favorite_count: 0,
          reply_count: 0,
          quote_count: 0,
          is_retweet: isRetweet,
          is_reply: false, // RSS 不提供回复信息
        };
        
        // 添加媒体信息
        if (mediaUrls.length > 0) {
          tweet.media = mediaUrls.map((url) => ({
            type: 'photo',
            url: url,
          }));
        }
        
        tweets.push(tweet);
        
        // 限制返回数量
        if (tweets.length >= count) {
          break;
        }
      } catch (itemError: any) {
        console.warn(`[Twitter RSS] Error processing RSS item for @${username}:`, itemError?.message);
        continue;
      }
    }
    
    console.log(`[Twitter RSS] Successfully fetched ${tweets.length} tweets for @${username}`);
    return tweets;
  } catch (error: any) {
    console.error(`[Twitter RSS] Error fetching tweets for @${username}:`, error?.message);
    return [];
  }
}
