/**
 * Twitter Adapter - 混合方案
 * 1. 首先尝试使用 GraphQL API（最可靠）
 * 2. 如果失败，尝试原来的 twitter-openapi-typescript 库
 * 3. 如果都失败，回退到 RSS 源方案
 * 4. 如果都失败，返回空数组
 */
import { TwitterOpenApi } from 'twitter-openapi-typescript';
import { getTwitterTweetsByUsernameRss } from './twitterRssAdapter';
import { getTwitterTweetsByUsernameGraphql } from './twitterGraphqlAdapter';
import { getTwitterTweetsByUsernameDirectAPI, getTwitterTweetsByUsernameNitter } from './twitterDirectAdapter';
import { getTwitterTweetsByUsernamePython } from './twitterPythonAdapter';

// 全局 API 客户端实例
let apiClient: any | null = null;
let initError: Error | null = null;

async function getClient() {
  if (apiClient) {
    return apiClient;
  }
  
  if (initError) {
    throw initError;
  }
  
  try {
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
    
    console.log('[Twitter] Successfully initialized API client');
    return apiClient;
  } catch (error: any) {
    initError = error;
    console.error('[Twitter] Failed to initialize API client:', error?.message);
    throw error;
  }
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
    console.log(`[Twitter] Fetching user profile for @${username}`);
    
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
    console.error(`[Twitter] Error fetching user profile for @${username}:`, error?.message);
    return null;
  }
}

/**
 * 通过用户名获取推文
 * 混合方案：首先尝试 GraphQL，然后尝试 API，最后回退到 RSS
 */
export async function getTwitterTweetsByUsername(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter] Fetching ${count} tweets for @${username}`);
    
    // 首先尝试 Python twikit 方案（最新方案）
    console.log(`[Twitter] Trying Python twikit method for @${username}`);
    const pythonTweets = await getTwitterTweetsByUsernamePython(username, count);
    
    if (pythonTweets.length > 0) {
      console.log(`[Twitter] Successfully fetched ${pythonTweets.length} tweets for @${username} via Python`);
      return pythonTweets;
    }
    
    // 如果 Python 失败，尝试直接 API 方案
    console.log(`[Twitter] Python method failed, trying Direct API method for @${username}`);
    const directTweets = await getTwitterTweetsByUsernameDirectAPI(username, count);
    
    if (directTweets.length > 0) {
      console.log(`[Twitter] Successfully fetched ${directTweets.length} tweets for @${username} via Direct API`);
      return directTweets;
    }
    
    // 如果直接 API 失败，尝试 Nitter 方案
    console.log(`[Twitter] Direct API failed, trying Nitter method for @${username}`);
    const nitterTweets = await getTwitterTweetsByUsernameNitter(username, count);
    
    if (nitterTweets.length > 0) {
      console.log(`[Twitter] Successfully fetched ${nitterTweets.length} tweets for @${username} via Nitter`);
      return nitterTweets;
    }
    
    // 如果 Nitter 也失败，尝试 GraphQL 方案
    console.log(`[Twitter] Nitter failed, trying GraphQL method for @${username}`);
    const graphqlTweets = await getTwitterTweetsByUsernameGraphql(username, count);
    
    if (graphqlTweets.length > 0) {
      console.log(`[Twitter] Successfully fetched ${graphqlTweets.length} tweets for @${username} via GraphQL`);
      return graphqlTweets;
    }
    
    // 如果 GraphQL 失败，尝试原来的 API
    try {
      console.log(`[Twitter] GraphQL failed, trying API method for @${username}`);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to initialize Twitter client');
      }
      
      // 获取用户推文
      const response = await client.getTweetApi().getUserTweets({
        userId: username,
        count: count,
      });
      
      const tweetsData = response.data?.data || [];
      
      if (!tweetsData || tweetsData.length === 0) {
        console.warn(`[Twitter] No tweets found via API for @${username}`);
        throw new Error('No tweets found');
      }
      
      const tweets: TwitterTweet[] = [];
      
      for (const tweet of tweetsData) {
        try {
          if (!tweet || !tweet.text) {
            continue;
          }
          
          // 检查是否为转推和回复
          const isRetweet = tweet.text.startsWith('RT @');
          const isReply = tweet.inReplyToStatusId !== undefined && tweet.inReplyToStatusId !== null;
          
          const post: TwitterTweet = {
            id: tweet.id || '',
            text: tweet.text || '',
            created_at: tweet.createdAt ? new Date(tweet.createdAt).toISOString() : '',
            retweet_count: tweet.retweetCount || 0,
            favorite_count: tweet.likeCount || 0,
            reply_count: tweet.replyCount || 0,
            quote_count: tweet.quoteCount || 0,
            is_retweet: isRetweet,
            is_reply: isReply,
          };
          
          tweets.push(post);
          
          if (tweets.length >= count) {
            break;
          }
        } catch (tweetError: any) {
          console.warn(`[Twitter] Error processing tweet for @${username}:`, tweetError?.message);
          continue;
        }
      }
      
      if (tweets.length > 0) {
        console.log(`[Twitter] Successfully fetched ${tweets.length} tweets for @${username} via API`);
        return tweets;
      }
    } catch (apiError: any) {
      console.warn(`[Twitter] API method failed for @${username}:`, apiError?.message);
    }
    
    // 如果所有方案都失败，使用 RSS 方案
    console.log(`[Twitter] All methods failed, falling back to RSS for @${username}`);
    return await getTwitterTweetsByUsernameRss(username, count);
  } catch (error: any) {
    console.error(`[Twitter] Error fetching tweets for @${username}:`, error?.message);
    return [];
  }
}
