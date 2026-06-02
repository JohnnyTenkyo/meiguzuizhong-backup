/**
 * Twitter Direct Adapter - 使用直接 HTTP 请求
 * 调用 Twitter 的内部 API，无需第三方库
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

let axiosInstance: AxiosInstance | null = null;

/**
 * 创建 Axios 实例
 */
function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: 'https://x.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
    });
  }
  
  return axiosInstance;
}

/**
 * 通过直接 API 调用获取推文
 */
export async function getTwitterTweetsByUsernameDirectAPI(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter Direct] Fetching ${count} tweets for @${username}`);
    
    const client = getAxiosInstance();
    const tweets: TwitterTweet[] = [];
    
    // 尝试调用 Twitter 的搜索 API
    // 这使用的是 Twitter 前端使用的内部 API
    const searchQuery = `from:${username} -is:retweet`;
    
    try {
      const response = await client.get('/search', {
        params: {
          q: searchQuery,
          count: count,
          result_type: 'recent',
        },
      });
      
      const data = response.data;
      
      if (!data || !data.statuses) {
        console.warn(`[Twitter Direct] No tweets found for @${username}`);
        return [];
      }
      
      for (const tweet of data.statuses) {
        try {
          if (!tweet || !tweet.text) {
            continue;
          }
          
          const isRetweet = tweet.text.startsWith('RT @');
          const isReply = tweet.in_reply_to_status_id !== undefined && tweet.in_reply_to_status_id !== null;
          
          const post: TwitterTweet = {
            id: tweet.id_str || tweet.id || '',
            text: tweet.text || '',
            created_at: tweet.created_at ? new Date(tweet.created_at).toISOString() : '',
            retweet_count: tweet.retweet_count || 0,
            favorite_count: tweet.favorite_count || 0,
            reply_count: tweet.reply_count || 0,
            quote_count: tweet.quote_count || 0,
            is_retweet: isRetweet,
            is_reply: isReply,
          };
          
          tweets.push(post);
          
          if (tweets.length >= count) {
            break;
          }
        } catch (tweetError: any) {
          console.warn(`[Twitter Direct] Error processing tweet:`, tweetError?.message);
          continue;
        }
      }
      
      if (tweets.length > 0) {
        console.log(`[Twitter Direct] Successfully fetched ${tweets.length} tweets for @${username}`);
        return tweets;
      }
    } catch (apiError: any) {
      console.warn(`[Twitter Direct] Search API failed:`, apiError?.message);
    }
    
    // 如果搜索 API 失败，尝试直接访问用户页面并解析 HTML
    console.log(`[Twitter Direct] Trying to fetch user timeline for @${username}`);
    
    try {
      const response = await client.get(`/${username}`, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      
      const html = response.data;
      
      // 尝试从 HTML 中提取推文数据
      // Twitter 在页面中嵌入了 JSON 数据
      const jsonMatch = html.match(/window\["__INITIAL_STATE__"\]\s*=\s*({[\s\S]*?});/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const initialState = JSON.parse(jsonMatch[1]);
          
          // 遍历状态对象以查找推文
          const tweets: TwitterTweet[] = [];
          
          // 这是一个简化的解析，实际的 Twitter 数据结构可能更复杂
          console.log(`[Twitter Direct] Extracted initial state for @${username}`);
          
          return tweets;
        } catch (parseError: any) {
          console.warn(`[Twitter Direct] Failed to parse initial state:`, parseError?.message);
        }
      }
    } catch (timelineError: any) {
      console.warn(`[Twitter Direct] Failed to fetch timeline:`, timelineError?.message);
    }
    
    console.log(`[Twitter Direct] All methods failed for @${username}`);
    return [];
  } catch (error: any) {
    console.error(`[Twitter Direct] Error fetching tweets for @${username}:`, error?.message);
    return [];
  }
}

/**
 * 通过 Nitter 公共实例获取推文（备选方案）
 */
export async function getTwitterTweetsByUsernameNitter(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter Nitter] Fetching ${count} tweets for @${username}`);
    
    // Nitter 公共实例列表
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.1d4.us',
      'https://nitter.kavin.rocks',
    ];
    
    for (const instance of nitterInstances) {
      try {
        console.log(`[Twitter Nitter] Trying ${instance}`);
        
        const response = await axios.get(`${instance}/${username}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        });
        
        const html = response.data;
        
        // 简单的 HTML 解析来提取推文
        // 这是一个基本的实现，可能需要更复杂的 HTML 解析
        const tweetRegex = /<div class="tweet-body">([\s\S]*?)<\/div>/g; // eslint-disable-line no-control-regex
        const matches = Array.from(html.matchAll(tweetRegex));
        
        const tweets: TwitterTweet[] = [];
        
        for (const match of matches) {
          if (tweets.length >= count) break;
          
          try {
            const matchArray = match as RegExpExecArray;
            const tweetHtml = matchArray[1];
            
            // 提取推文文本
            const textMatch = tweetHtml.match(/<p class="tweet-text"[^>]*>([\s\S]*?)<\/p>/);
            const text = textMatch ? (textMatch[1] as string).replace(/<[^>]*>/g, '').trim() : '';
            
            if (!text) continue;
            
            tweets.push({
              id: `nitter-${Date.now()}-${Math.random()}`,
              text: text,
              created_at: new Date().toISOString(),
              retweet_count: 0,
              favorite_count: 0,
              reply_count: 0,
              quote_count: 0,
              is_retweet: text.startsWith('RT @'),
              is_reply: false,
            });
          } catch (tweetError: any) {
            console.warn(`[Twitter Nitter] Error parsing tweet:`, tweetError?.message);
            continue;
          }
        }
        
        if (tweets.length > 0) {
          console.log(`[Twitter Nitter] Successfully fetched ${tweets.length} tweets from ${instance}`);
          return tweets;
        }
      } catch (instanceError: any) {
        console.warn(`[Twitter Nitter] Failed to fetch from ${instance}:`, instanceError?.message);
        continue;
      }
    }
    
    console.log(`[Twitter Nitter] All Nitter instances failed for @${username}`);
    return [];
  } catch (error: any) {
    console.error(`[Twitter Nitter] Error fetching tweets for @${username}:`, error?.message);
    return [];
  }
}
