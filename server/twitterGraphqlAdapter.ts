/**
 * Twitter GraphQL Adapter - 直接调用 Twitter GraphQL API
 * 使用 cookies 认证，无需第三方库
 */

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
 * 解析 cookies 字符串为对象
 */
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * 通过 GraphQL 获取推文
 */
export async function getTwitterTweetsByUsernameGraphql(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  try {
    console.log(`[Twitter GraphQL] Fetching ${count} tweets for @${username}`);
    
    const authToken = process.env.TWITTER_AUTH_TOKEN;
    const ct0 = process.env.TWITTER_CT0;
    const cookieString = process.env.TWITTER_COOKIES;
    
    if (!authToken || !ct0) {
      console.warn('[Twitter GraphQL] Missing TWITTER_AUTH_TOKEN or TWITTER_CT0');
      return [];
    }
    
    // 构建 Cookie 头
    let cookieHeader = `auth_token=${authToken}; ct0=${ct0}`;
    
    if (cookieString) {
      const parsedCookies = parseCookies(cookieString);
      const additionalCookies = Object.entries(parsedCookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      if (additionalCookies) {
        cookieHeader += `; ${additionalCookies}`;
      }
    }
    
    // 首先获取用户 ID
    console.log(`[Twitter GraphQL] Fetching user ID for @${username}`);
    
    const userResponse = await fetch('https://x.com/i/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookieHeader,
        'X-Csrf-Token': ct0,
      },
      body: JSON.stringify({
        operationName: 'UserByScreenName',
        variables: { screen_name: username },
        query: `query UserByScreenName($screen_name: String!) {
          user(screen_name: $screen_name) {
            result {
              __typename
              id
              rest_id
              legacy {
                screen_name
                name
              }
            }
          }
        }`,
      }),
    });
    
    if (!userResponse.ok) {
      console.warn(`[Twitter GraphQL] Failed to fetch user ID for @${username}: ${userResponse.status}`);
      return [];
    }
    
    const userData = await userResponse.json() as any;
    const userId = userData?.data?.user?.result?.rest_id;
    
    if (!userId) {
      console.warn(`[Twitter GraphQL] Could not find user ID for @${username}`);
      return [];
    }
    
    console.log(`[Twitter GraphQL] Found user ID: ${userId}`);
    
    // 获取用户推文
    console.log(`[Twitter GraphQL] Fetching tweets for user ID: ${userId}`);
    
    const tweetsResponse = await fetch('https://x.com/i/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookieHeader,
        'X-Csrf-Token': ct0,
      },
      body: JSON.stringify({
        operationName: 'UserTweets',
        variables: {
          userId: userId,
          count: count,
          includePromotedContent: false,
          withVoice: false,
        },
        query: `query UserTweets($userId: ID!, $count: Int!) {
          user(id: $userId) {
            result {
              timeline_v2 {
                timeline {
                  instructions {
                    entries {
                      sortIndex
                      content {
                        entryType
                        __typename
                        itemContent {
                          __typename
                          tweet_results {
                            result {
                              __typename
                              rest_id
                              core {
                                user_results {
                                  result {
                                    legacy {
                                      screen_name
                                    }
                                  }
                                }
                              }
                              legacy {
                                created_at
                                full_text
                                retweet_count
                                favorite_count
                                reply_count
                                quote_count
                                in_reply_to_status_id
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });
    
    if (!tweetsResponse.ok) {
      console.warn(`[Twitter GraphQL] Failed to fetch tweets: ${tweetsResponse.status}`);
      return [];
    }
    
    const tweetsData = await tweetsResponse.json() as any;
    const tweets: TwitterTweet[] = [];
    
    try {
      const instructions = tweetsData?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
      
      for (const instruction of instructions) {
        const entries = instruction?.entries || [];
        
        for (const entry of entries) {
          try {
            const tweet = entry?.content?.itemContent?.tweet_results?.result;
            const legacy = tweet?.legacy;
            
            if (!tweet || !legacy) continue;
            
            const text = legacy.full_text || '';
            if (!text) continue;
            
            const isRetweet = text.startsWith('RT @');
            const isReply = legacy.in_reply_to_status_id !== undefined && legacy.in_reply_to_status_id !== null;
            
            tweets.push({
              id: tweet.rest_id || '',
              text: text,
              created_at: legacy.created_at ? new Date(legacy.created_at).toISOString() : '',
              retweet_count: legacy.retweet_count || 0,
              favorite_count: legacy.favorite_count || 0,
              reply_count: legacy.reply_count || 0,
              quote_count: legacy.quote_count || 0,
              is_retweet: isRetweet,
              is_reply: isReply,
            });
            
            if (tweets.length >= count) break;
          } catch (tweetError: any) {
            console.warn('[Twitter GraphQL] Error parsing tweet:', tweetError?.message);
            continue;
          }
        }
        
        if (tweets.length >= count) break;
      }
    } catch (parseError: any) {
      console.warn('[Twitter GraphQL] Error parsing response:', parseError?.message);
    }
    
    console.log(`[Twitter GraphQL] Successfully fetched ${tweets.length} tweets for @${username}`);
    return tweets;
  } catch (error: any) {
    console.error(`[Twitter GraphQL] Error fetching tweets for @${username}:`, error?.message);
    return [];
  }
}
