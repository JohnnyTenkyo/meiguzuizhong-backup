/**
 * Twitter Puppeteer Adapter - 使用浏览器自动化获取推文
 * 最可靠的方案，无需 API 密钥或认证
 */
import puppeteer, { Browser } from 'puppeteer';

let browser: Browser | null = null;

async function getBrowser() {
  if (!browser) {
    try {
      console.log('[Twitter Puppeteer] Launching browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      console.log('[Twitter Puppeteer] Browser launched successfully');
    } catch (error: any) {
      console.error('[Twitter Puppeteer] Failed to launch browser:', error?.message);
      throw error;
    }
  }
  
  return browser;
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
 * 通过 Puppeteer 获取推文
 */
export async function getTwitterTweetsByUsernamePuppeteer(
  username: string,
  count: number = 20
): Promise<TwitterTweet[]> {
  let page = null;
  
  try {
    console.log(`[Twitter Puppeteer] Fetching ${count} tweets for @${username}`);
    
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 720 });
    
    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // 访问 X/Twitter
    const url = `https://x.com/${username}`;
    console.log(`[Twitter Puppeteer] Navigating to ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待推文加载
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 }).catch(() => {
      console.warn('[Twitter Puppeteer] No tweets found or timeout');
    });
    
    // 滚动页面以加载更多推文
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 提取推文数据
    const tweets = await page.evaluate(() => {
      const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
      const tweets: any[] = [];
      
      tweetElements.forEach((element) => {
        try {
          // 提取推文文本
          const textElement = element.querySelector('[data-testid="tweetText"]');
          const text = textElement?.textContent || '';
          
          if (!text) return;
          
          // 提取交互数据
          const replyButton = element.querySelector('[data-testid="reply"]');
          const retweetButton = element.querySelector('[data-testid="retweet"]');
          const likeButton = element.querySelector('[data-testid="like"]');
          
          // 提取数字
          const extractNumber = (element: Element | null): number => {
            if (!element) return 0;
            const text = element.getAttribute('aria-label') || element.textContent || '0';
            const match = text.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          };
          
          // 检查是否为转推
          const isRetweet = text.startsWith('RT @');
          
          tweets.push({
            id: `tweet-${Date.now()}-${Math.random()}`,
            text: text,
            created_at: new Date().toISOString(),
            retweet_count: extractNumber(retweetButton),
            favorite_count: extractNumber(likeButton),
            reply_count: extractNumber(replyButton),
            quote_count: 0,
            is_retweet: isRetweet,
            is_reply: false,
          });
        } catch (error) {
          console.warn('[Twitter Puppeteer] Error parsing tweet:', error);
        }
      });
      
      return tweets;
    });
    
    console.log(`[Twitter Puppeteer] Successfully fetched ${tweets.length} tweets for @${username}`);
    return tweets.slice(0, count) as TwitterTweet[];
  } catch (error: any) {
    console.error(`[Twitter Puppeteer] Error fetching tweets for @${username}:`, error?.message);
    return [];
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.warn('[Twitter Puppeteer] Error closing page:', error);
      }
    }
  }
}

/**
 * 关闭浏览器
 */
export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      browser = null;
      console.log('[Twitter Puppeteer] Browser closed');
    } catch (error: any) {
      console.error('[Twitter Puppeteer] Error closing browser:', error?.message);
    }
  }
}
