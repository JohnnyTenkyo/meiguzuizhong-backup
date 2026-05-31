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
    console.error(`Error fetching user @${username}:`, error?.message || error);
    return null;
  }
}

// 备用：未来使用更稳定的 API 库时的实现

/**
 * 通过用户名获取推文
 */
export async function getTwitterTweetsByUsername(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  // 暂时禁用 Twitter 数据获取，因为 twitter-openapi-typescript 库有 bug
  // TODO: 修复或替敢为更稳定的 Twitter API 库
  console.warn(`[Twitter] Disabled for @${username} due to library issues`);
  return [] as TwitterTweet[];
  
  // 下面的代码暂时不执行
  // eslint-disable-next-line no-unreachable
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
    let tweetsResponse;
    try {
      console.log(`[Twitter] Fetching tweets for userId: ${userId}`);
      tweetsResponse = await client.getTweetApi().getUserTweets({
        userId,
        count,
      });
      console.log(`[Twitter] Got response:`, tweetsResponse ? 'has data' : 'null/undefined');
    } catch (apiError: any) {
      console.error(`[Twitter] API error for @${username}:`, apiError?.message || apiError);
      console.error(`[Twitter] Error type:`, apiError?.constructor?.name);
      console.error(`[Twitter] Error stack:`, apiError?.stack);
      // 即使出错也返回空数组而不是抱错
      return [];
    }
    
    // 检查响应是否有效
    if (!tweetsResponse) {
      console.warn(`No response from Twitter API for @${username}`);
      return [];
    }
    
    // tweetsResponse 可能有多种格式，尝试多种方式获取数据
    let tweetsData = [];
    
    // 方式1：tweetsResponse.data.data
    if ((tweetsResponse.data as any)?.data) {
      tweetsData = (tweetsResponse.data as any).data;
    }
    // 方式2：tweetsResponse.data 直接是数组
    else if (Array.isArray(tweetsResponse.data)) {
      tweetsData = tweetsResponse.data;
    }
    // 方式3：tweetsResponse 直接是数组
    else if (Array.isArray(tweetsResponse)) {
      tweetsData = tweetsResponse;
    }
    // 方式4：tweetsResponse.result
    else if ((tweetsResponse as any)?.result) {
      tweetsData = (tweetsResponse as any).result;
    }
    
    const tweets = Array.isArray(tweetsData) ? tweetsData : [];
    console.log(`[Twitter] Parsed tweets for @${username}:`, tweets.length, 'items');
    
    if (tweets.length === 0) {
      console.warn(`[Twitter] No tweets found for @${username}`);
    }
    
    const posts: TwitterTweet[] = [];
    
    for (const tweet of tweets) {
      try {
        // 检查是否有有效的推文数据
        if (!tweet) {
          continue;
        }
        
        // 尝试多种数据格式
        let tweetData = tweet.raw?.result || tweet;
        if (!tweetData) {
          continue;
        }
        
        const result = tweetData as any;
        const legacy = result.legacy || {};
        
        // 检查是否有有效的文本
        if (!legacy.fullText && !legacy.text) {
          continue;
        }
      
      // 检查是否为转推和回复（但不过滤，让调用方决定）
      const isRetweet = legacy.retweetedStatusResult !== undefined;
      const isReply = legacy.inReplyToStatusIdStr !== undefined;
      
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
      if (legacy.entities?.media && Array.isArray(legacy.entities.media) && legacy.entities.media.length > 0) {
        try {
          post.media = legacy.entities.media.map((media: any) => ({
            type: media.type || 'photo',
            url: media.mediaUrlHttps || media.url || '',
          }));
        } catch (mediaError: any) {
          console.warn(`[Twitter] Error processing media for tweet:`, mediaError?.message);
        }
      }
      
        posts.push(post);
        
        // 限制返回数量
        if (posts.length >= count) {
          break;
        }
      } catch (tweetError: any) {
        console.warn(`[Twitter] Error processing tweet for @${username}:`, tweetError?.message || tweetError);
        continue;
      }
    }
    
    return posts;
  } catch (error: any) {
    console.error('Error fetching Twitter tweets:', error);
    return [];
  }
}
