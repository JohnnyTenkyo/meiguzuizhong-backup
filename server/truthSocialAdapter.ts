/**
 * Truth Social Adapter - 使用 trumpstruth.org RSS feed 获取帖子
 * 不依赖 Python，纯 Node.js 实现
 */

/**
 * Truth Social 是否已配置（RSS feed 不需要配置，始终可用）
 */
export function isTruthSocialConfigured(): boolean {
  return true;
}

interface TruthSocialPost {
  id: string;
  text: string;
  created_at: string;
  favourites_count: number;
  reblogs_count: number;
  replies_count: number;
  url: string;
}

/**
 * 从 trumpstruth.org RSS feed 获取特朗普的 Truth Social 帖子
 */
export async function getTruthSocialPosts(
  username: string = 'realDonaldTrump',
  count: number = 20
): Promise<TruthSocialPost[]> {
  try {
    console.log(`Fetching Truth Social posts for @${username} via RSS feed...`);

    // 使用 trumpstruth.org RSS feed
    const rssUrl = 'https://trumpstruth.org/feed';
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`RSS feed returned ${response.status}`);
    }

    const xml = await response.text();
    const posts = parseRSSFeed(xml, count);

    console.log(`Successfully fetched ${posts.length} Truth Social posts for @${username}`);
    return posts;
  } catch (error) {
    console.error(`Error fetching Truth Social posts for @${username}:`, error);
    
    // 尝试备用方案：直接抓取 trumpstruth.org 主页
    try {
      return await fetchFromTrumpsTruthWeb(count);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * 解析 RSS XML 为帖子数组
 */
function parseRSSFeed(xml: string, count: number): TruthSocialPost[] {
  const posts: TruthSocialPost[] = [];
  
  // 使用正则表达式解析 RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let index = 0;

  while ((match = itemRegex.exec(xml)) !== null && index < count) {
    const itemXml = match[1];
    
    const title = extractCDATA(itemXml, 'title') || '';
    const link = extractTag(itemXml, 'link') || '';
    const description = extractCDATA(itemXml, 'description') || '';
    const pubDate = extractTag(itemXml, 'pubDate') || '';
    const guid = extractTag(itemXml, 'guid') || '';

    // 从 description 中提取纯文本
    let text = description
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();

    // 如果 description 为空，使用 title
    if (!text && title) {
      text = title.replace(/\[No Title\] - /, '').trim();
    }

    // 从 guid 或 link 中提取 ID
    const idMatch = (guid || link).match(/statuses\/(\d+)/);
    const id = idMatch ? idMatch[1] : `ts_${index}`;

    // 跳过空帖子（可能是纯图片/视频帖子）
    // 但仍然包含它们，标记为 [图片/视频]
    if (!text) {
      text = '[图片/视频内容]';
    }

    posts.push({
      id,
      text,
      created_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      favourites_count: 0, // RSS feed 不包含互动数据
      reblogs_count: 0,
      replies_count: 0,
      url: link || `https://truthsocial.com/@realDonaldTrump/${id}`,
    });

    index++;
  }

  return posts;
}

/**
 * 备用方案：从 trumpstruth.org 主页抓取帖子
 */
async function fetchFromTrumpsTruthWeb(count: number): Promise<TruthSocialPost[]> {
  console.log('Trying fallback: fetching from trumpstruth.org web...');
  
  const response = await fetch('https://trumpstruth.org/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Web page returned ${response.status}`);
  }

  const html = await response.text();
  const posts: TruthSocialPost[] = [];

  // 简单的 HTML 解析提取帖子
  const postRegex = /statuses\/(\d+)/g;
  let match;
  const seenIds = new Set<string>();

  while ((match = postRegex.exec(html)) !== null && posts.length < count) {
    const id = match[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    posts.push({
      id,
      text: `Truth Social Post #${id}`,
      created_at: new Date().toISOString(),
      favourites_count: 0,
      reblogs_count: 0,
      replies_count: 0,
      url: `https://truthsocial.com/@realDonaldTrump/${id}`,
    });
  }

  return posts;
}

/**
 * 从 XML 中提取 CDATA 内容
 */
function extractCDATA(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * 从 XML 中提取标签内容
 */
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}
