/**
 * Twitter Python Adapter - 调用 Python twikit 服务
 */

import axios, { AxiosInstance } from 'axios';

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

let pythonClient: AxiosInstance | null = null;

/**
 * 获取 Python 服务客户端
 */
function getPythonClient(): AxiosInstance {
  if (!pythonClient) {
    pythonClient = axios.create({
      baseURL: 'http://127.0.0.1:5000',
      timeout: 60000, // 60 秒超时
    });
  }
  
  return pythonClient;
}

/**
 * 检查 Python 服务是否运行
 */
export async function checkPythonServiceHealth(): Promise<boolean> {
  try {
    const client = getPythonClient();
    const response = await client.get('/health');
    return response.status === 200;
  } catch (error: any) {
    console.warn(`[Twitter Python] Service health check failed: ${error?.message}`);
    return false;
  }
}

/**
 * 通过 Python twikit 获取推文
 */
export async function getTwitterTweetsByUsernamePython(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter Python] Fetching ${count} tweets for @${username}`);
    
    // 首先检查服务是否运行
    const isHealthy = await checkPythonServiceHealth();
    if (!isHealthy) {
      console.warn(`[Twitter Python] Service is not healthy`);
      return [];
    }
    
    const client = getPythonClient();
    
    try {
      const response = await client.get('/tweets', {
        params: {
          username: username,
          count: count,
        },
      });
      
      if (!response.data || !response.data.tweets) {
        console.warn(`[Twitter Python] No tweets found for @${username}`);
        return [];
      }
      
      const tweets: TwitterTweet[] = response.data.tweets.map((tweet: any) => ({
        id: tweet.id || '',
        text: tweet.text || '',
        created_at: tweet.created_at || '',
        retweet_count: tweet.retweet_count || 0,
        favorite_count: tweet.favorite_count || 0,
        reply_count: tweet.reply_count || 0,
        quote_count: tweet.quote_count || 0,
        is_retweet: tweet.is_retweet || false,
        is_reply: tweet.is_reply || false,
      }));
      
      if (tweets.length > 0) {
        console.log(`[Twitter Python] Successfully fetched ${tweets.length} tweets for @${username}`);
        return tweets;
      }
    } catch (apiError: any) {
      console.warn(`[Twitter Python] API error: ${apiError?.message}`);
      return [];
    }
    
    return [];
  } catch (error: any) {
    console.error(`[Twitter Python] Error fetching tweets for @${username}: ${error?.message}`);
    return [];
  }
}

/**
 * 通过 Python twikit 获取用户信息
 */
export async function getTwitterUserProfilePython(username: string) {
  try {
    console.log(`[Twitter Python] Fetching user profile for @${username}`);
    
    // 首先检查服务是否运行
    const isHealthy = await checkPythonServiceHealth();
    if (!isHealthy) {
      console.warn(`[Twitter Python] Service is not healthy`);
      return null;
    }
    
    const client = getPythonClient();
    
    try {
      const response = await client.get('/user', {
        params: {
          username: username,
        },
      });
      
      if (!response.data) {
        console.warn(`[Twitter Python] User @${username} not found`);
        return null;
      }
      
      console.log(`[Twitter Python] Successfully fetched user profile for @${username}`);
      return response.data;
    } catch (apiError: any) {
      console.warn(`[Twitter Python] API error: ${apiError?.message}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[Twitter Python] Error fetching user profile for @${username}: ${error?.message}`);
    return null;
  }
}
