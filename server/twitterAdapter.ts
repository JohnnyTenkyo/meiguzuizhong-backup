/**
 * Twitter Adapter - 使用 twitter-openapi-typescript（完全免费）
 * 需要配置 TWITTER_AUTH_TOKEN 和 TWITTER_CT0 环境变量
 */
import { TwitterOpenApi } from 'twitter-openapi-typescript';

// 全局 API 客户端实例
let apiClient: any | null = null;

async function getClient() {
  if (!apiClient) {
    // 从环境变量获取 tokens
    const authToken = process.env.TWITTER_AUTH_TOKEN;
    const ct0 = process.env.TWITTER_CT0;
    
    if (!authToken || !ct0) {
      throw new Error('TWITTER_AUTH_TOKEN and TWITTER_CT0 environment variables are required');
    }
    
    // 创建 API 实例
    const api = new TwitterOpenApi();
    
    // 使用 cookies 登录
    apiClient = await api.getClientFromCookies({
      auth_token: authToken,
      ct0: ct0,
    });
  }
  
  return apiClient;
}

interface TwitterUser {
  rest_id: string;
  screen_name: string;
  name: string;
  description?: string;
  followers_count: number;
  verified: boolean;
  profile_image_url?: string;
}

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
 * 获取 Twitter 用户信息
 */
export async function getTwitterUserProfile(username: string): Promise<TwitterUser | null> {
  try {
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to initialize Twitter client');
    }
    
    // 获取用户信息
    const response = await client.getUserApi().getUserByScreenName({ screenName: username });
    const user = response.data;
    
    if (!user || !user.raw?.result) {
      console.warn(`User @${username} not found`);
      return null;
    }
    
    const result = user.raw.result as any;
    const legacy = result.legacy || {};
    
    return {
      rest_id: result.restId || result.id || '',
      screen_name: legacy.screenName || username,
      name: legacy.name || '',
      description: legacy.description || '',
      followers_count: legacy.followersCount || 0,
      verified: result.isBlueVerified || legacy.verified || false,
      profile_image_url: legacy.profileImageUrlHttps || '',
    };
  } catch (error: any) {
    console.error('Error fetching Twitter user profile:', error);
    return null;
  }
}

/**
 * 通过用户名获取推文
 */
export async function getTwitterTweetsByUsername(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to initialize Twitter client');
    }
    
    // 先获取用户信息
    const userResponse = await client.getUserApi().getUserByScreenName({ screenName: username });
    const user = userResponse.data;
    
    if (!user || !user.raw?.result) {
      console.warn(`User @${username} not found`);
      return [];
    }
    
    const userId = (user.raw.result as any).restId || (user.raw.result as any).id;
    
    if (!userId) {
      console.warn(`Cannot get user ID for @${username}`);
      return [];
    }
    
    // 获取用户推文
    const tweetsResponse = await client.getTweetApi().getUserTweets({
      userId,
      count,
    });
    
    // tweetsResponse.data 是一个对象，包含 { raw, cursor, data } 字段
    // 真正的推文数据在 tweetsResponse.data.data 中
    const tweetsData = (tweetsResponse.data as any)?.data || [];
    const tweets = Array.isArray(tweetsData) ? tweetsData : [];
    
    console.log(`Found ${tweets.length} tweets for @${username}`);
    
    const posts: TwitterTweet[] = [];
    
    for (const tweet of tweets) {
      // 检查是否有 raw 数据
      if (!tweet.raw?.result) {
        continue;
      }
      
      const result = tweet.raw.result as any;
      const legacy = result.legacy || {};
      
      // 过滤转推和回复（只保留原创推文）
      const isRetweet = legacy.retweetedStatusResult !== undefined;
      const isReply = legacy.inReplyToStatusIdStr !== undefined;
      
      if (isRetweet || isReply) {
        continue;
      }
      
      const post: TwitterTweet = {
        id: result.restId || tweet.id || '',
        text: legacy.fullText || '',
        created_at: legacy.createdAt || '',
        retweet_count: legacy.retweetCount || 0,
        favorite_count: legacy.favoriteCount || 0,
        reply_count: legacy.replyCount || 0,
        quote_count: legacy.quoteCount || 0,
        is_retweet: isRetweet,
        is_reply: isReply,
      };
      
      // 添加媒体信息
      if (legacy.entities?.media && legacy.entities.media.length > 0) {
        post.media = legacy.entities.media.map((media: any) => ({
          type: media.type || 'photo',
          url: media.mediaUrlHttps || media.url || '',
        }));
      }
      
      posts.push(post);
      
      // 限制返回数量
      if (posts.length >= count) {
        break;
      }
    }
    
    return posts;
  } catch (error: any) {
    console.error('Error fetching Twitter tweets:', error);
    return [];
  }
}
