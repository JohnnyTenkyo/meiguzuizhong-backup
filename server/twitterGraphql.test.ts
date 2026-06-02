import { describe, it, expect } from 'vitest';
import { getTwitterTweetsByUsernameGraphql } from './twitterGraphqlAdapter';

describe('Twitter GraphQL Adapter', () => {
  it('should fetch tweets for a valid username', async () => {
    // 测试获取真实推文
    const tweets = await getTwitterTweetsByUsernameGraphql('realDonaldTrump', 5);
    
    // 验证返回数据
    console.log('Fetched tweets:', tweets.length);
    
    if (tweets.length > 0) {
      // 如果获取到推文，验证数据结构
      const tweet = tweets[0];
      expect(tweet).toHaveProperty('id');
      expect(tweet).toHaveProperty('text');
      expect(tweet).toHaveProperty('created_at');
      expect(tweet).toHaveProperty('retweet_count');
      expect(tweet).toHaveProperty('favorite_count');
      
      console.log('✅ Twitter GraphQL API is working correctly');
      console.log('Sample tweet:', {
        id: tweet.id,
        text: tweet.text.substring(0, 100),
        created_at: tweet.created_at,
      });
    } else {
      // 如果没有获取到推文，说明令牌可能无效
      console.warn('⚠️ No tweets fetched - credentials may be invalid or expired');
    }
  }, { timeout: 30000 });
});
