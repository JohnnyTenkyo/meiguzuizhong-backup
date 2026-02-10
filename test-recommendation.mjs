/**
 * 测试推荐算法并触发刷新
 */

import { calculateRecommendationScore } from './server/advancedRecommendation.ts';

console.log('Testing recommendation algorithm...\n');

// 测试几个流动性好的股票
const testSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'];

for (const symbol of testSymbols) {
  console.log(`\nAnalyzing ${symbol}...`);
  try {
    const result = await calculateRecommendationScore(symbol);
    if (result) {
      console.log(`✓ ${symbol}:`);
      console.log(`  Total Score: ${result.totalScore.toFixed(1)}`);
      console.log(`  Priority 1 (Ladder): ${result.priority1Score.toFixed(1)}`);
      console.log(`  Priority 2 (CD): ${result.priority2Score.toFixed(1)}`);
      console.log(`  Priority 3 (ChanLun): ${result.priority3Score.toFixed(1)}`);
      console.log(`  Priority 4 (Momentum): ${result.priority4Score.toFixed(1)}`);
      console.log(`  Price: $${result.price.toFixed(2)}`);
      console.log(`  Change: ${result.changePercent.toFixed(2)}%`);
      console.log(`  Reason: ${result.reason}`);
    } else {
      console.log(`✗ ${symbol}: No data`);
    }
  } catch (error) {
    console.error(`✗ ${symbol}: Error -`, error.message);
  }
}

console.log('\n\nTest completed!');
