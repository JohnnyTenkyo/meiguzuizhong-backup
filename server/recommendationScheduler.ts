/**
 * 推荐股票定时刷新调度器
 * 中国时间21:30到次日凌晨5:00每半小时刷新一次
 */

import cron from 'node-cron';
import { calculateRecommendationScore } from './advancedRecommendation';

let isRunning = false;

/**
 * 刷新推荐股票
 */
async function refreshRecommendations() {
  if (isRunning) {
    console.log('[Scheduler] Previous refresh still running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[Scheduler] Starting recommendation refresh...');

  try {
    const { US_STOCKS } = await import('../shared/stockPool');
    const stocksToCheck = US_STOCKS.slice(0, 50);

    const scores = [];
    const batchSize = 5;

    for (let i = 0; i < stocksToCheck.length; i += batchSize) {
      const batch = stocksToCheck.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(symbol => calculateRecommendationScore(symbol))
      );
      scores.push(...batchResults.filter(s => s !== null));

      if (i + batchSize < stocksToCheck.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const qualified = scores.filter(s => s!.totalScore > 30);
    const topRecommended = qualified
      .sort((a, b) => b!.totalScore - a!.totalScore)
      .slice(0, 10);

    console.log('[Scheduler] Refresh completed. Top 10:', 
      topRecommended.map(s => `${s!.symbol}(${s!.totalScore.toFixed(1)})`).join(', '));

    // 这里可以将结果存入缓存或数据库
    // 目前依赖 stockRouter.ts 中的缓存机制

  } catch (error) {
    console.error('[Scheduler] Refresh failed:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * 启动定时任务
 * 中国时间(UTC+8) 21:30-05:00 每半小时执行一次
 * 
 * Cron表达式说明:
 * - 21:30, 22:00, 22:30, 23:00, 23:30, 00:00, 00:30, 01:00, 01:30, 02:00, 02:30, 03:00, 03:30, 04:00, 04:30, 05:00
 * - 对应UTC时间: 13:30-21:00
 */
export function startRecommendationScheduler() {
  // 每半小时执行一次,但只在指定时间段内
  cron.schedule('0,30 * * * *', () => {
    const now = new Date();
    
    // 转换为中国时间(UTC+8)
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const hour = chinaTime.getUTCHours();
    const minute = chinaTime.getUTCMinutes();
    
    // 检查是否在21:30-05:00时间段内
    const isInTimeRange = 
      (hour === 21 && minute >= 30) ||  // 21:30-21:59
      (hour >= 22 && hour <= 23) ||      // 22:00-23:59
      (hour >= 0 && hour < 5) ||         // 00:00-04:59
      (hour === 5 && minute === 0);      // 05:00
    
    if (isInTimeRange) {
      console.log(`[Scheduler] Triggering refresh at China time ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      refreshRecommendations();
    }
  }, {
    timezone: 'UTC'
  });

  console.log('[Scheduler] Recommendation scheduler started (China time 21:30-05:00, every 30 minutes)');
  
  // 立即执行一次(用于测试)
  // refreshRecommendations();
}

/**
 * 手动触发刷新(用于测试)
 */
export function triggerManualRefresh() {
  console.log('[Scheduler] Manual refresh triggered');
  return refreshRecommendations();
}
