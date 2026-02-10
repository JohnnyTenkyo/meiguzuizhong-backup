/**
 * 高级推荐动能股算法
 * 基于多时间级别技术指标的智能推荐系统
 */

import axios from 'axios';
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============ 辅助函数 ============

function ema(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  if (data.length === 0) return result;
  
  result[0] = data[0];
  const k = 2 / (period + 1);
  for (let i = 1; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function calculateMACD(candles: Candle[], fast = 12, slow = 26, signal = 9) {
  const closes = candles.map(c => c.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  
  const diff = emaFast.map((v, i) => v - emaSlow[i]);
  const dea = ema(diff, signal);
  const macd = diff.map((v, i) => 2 * (v - dea[i]));
  
  return { diff, dea, macd };
}

// ============ 梯子指标 ============

interface LadderData {
  blueUp: number;
  blueDn: number;
  yellowUp: number;
  yellowDn: number;
}

function calculateLadder(candles: Candle[]): LadderData[] {
  if (candles.length === 0) return [];
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const A = ema(highs, 24);   // 蓝梯上轨
  const B = ema(lows, 23);    // 蓝梯下轨
  const A1 = ema(highs, 89);  // 黄梯上轨
  const B1 = ema(lows, 90);   // 黄梯下轨
  
  return candles.map((c, i) => ({
    blueUp: A[i],
    blueDn: B[i],
    yellowUp: A1[i],
    yellowDn: B1[i],
  }));
}

/**
 * 检测梯子穿越信号(优先级1)
 * 条件:
 * - 30分钟蓝梯开始走强穿过黄梯
 * - 最好是刚刚开始启动(蓝梯上轨穿过黄梯上轨一点,蓝梯下轨还没穿过黄梯上轨)
 * - 蜡烛图站在30分钟蓝梯下轨上方
 */
function checkLadderCross(candles: Candle[], ladder: LadderData[]): number {
  if (candles.length < 3 || ladder.length < 3) return 0;
  
  const last = ladder[ladder.length - 1];
  const prev = ladder[ladder.length - 2];
  const lastCandle = candles[candles.length - 1];
  
  // 蜡烛图站在蓝梯下轨上方
  const candleAboveBlueDn = lastCandle.close > last.blueDn;
  if (!candleAboveBlueDn) return 0;
  
  // 蓝梯上轨穿过黄梯上轨
  const blueUpCrossYellowUp = last.blueUp > last.yellowUp && prev.blueUp <= prev.yellowUp;
  
  // 蓝梯下轨还没穿过黄梯上轨(刚刚启动)
  const blueDnBelowYellowUp = last.blueDn < last.yellowUp;
  
  // 最佳信号:刚刚穿越
  if (blueUpCrossYellowUp && blueDnBelowYellowUp) {
    return 100; // 满分
  }
  
  // 次优信号:已经穿越但还在强势中
  if (last.blueUp > last.yellowUp && blueDnBelowYellowUp) {
    return 70;
  }
  
  // 一般信号:蓝梯完全在黄梯上方
  if (last.blueDn > last.yellowUp) {
    return 40;
  }
  
  return 0;
}

/**
 * 检测多时间级别梯子信号
 * 检查4h/3h/2h/1h级别的抄底信号
 */
function checkMultiTimeframeLadder(
  candles4h: Candle[],
  candles3h: Candle[],
  candles2h: Candle[],
  candles1h: Candle[]
): number {
  let score = 0;
  
  if (candles4h.length > 0) {
    const ladder4h = calculateLadder(candles4h);
    const signal4h = checkLadderCross(candles4h, ladder4h);
    if (signal4h > 0) score += 25;
  }
  
  if (candles3h.length > 0) {
    const ladder3h = calculateLadder(candles3h);
    const signal3h = checkLadderCross(candles3h, ladder3h);
    if (signal3h > 0) score += 20;
  }
  
  if (candles2h.length > 0) {
    const ladder2h = calculateLadder(candles2h);
    const signal2h = checkLadderCross(candles2h, ladder2h);
    if (signal2h > 0) score += 15;
  }
  
  if (candles1h.length > 0) {
    const ladder1h = calculateLadder(candles1h);
    const signal1h = checkLadderCross(candles1h, ladder1h);
    if (signal1h > 0) score += 10;
  }
  
  return Math.min(score, 100);
}

// ============ 禅动指标(CD指标)============

/**
 * 检测禅动指标买入信号(优先级2)
 * 简化版:检测MACD金叉和底背离
 */
function checkCDSignal(candles: Candle[]): number {
  if (candles.length < 30) return 0;
  
  const { diff, dea, macd } = calculateMACD(candles);
  const last = candles.length - 1;
  const prev = last - 1;
  
  let score = 0;
  
  // MACD金叉(DIFF上穿DEA)
  if (diff[last] > dea[last] && diff[prev] <= dea[prev]) {
    score += 50;
  }
  
  // MACD柱转正
  if (macd[last] > 0 && macd[prev] <= 0) {
    score += 30;
  }
  
  // DIFF在0轴附近(接近黄金支撑线)
  if (Math.abs(diff[last]) < 0.5) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

// ============ 缠论分型 ============

interface MergedCandle {
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  originalIndices: number[];
}

function mergeCandles(candles: Candle[]): MergedCandle[] {
  if (candles.length === 0) return [];
  
  const merged: MergedCandle[] = [{
    time: candles[0].time,
    high: candles[0].high,
    low: candles[0].low,
    open: candles[0].open,
    close: candles[0].close,
    originalIndices: [0],
  }];
  
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const last = merged[merged.length - 1];
    
    const isContaining = (curr.high >= last.high && curr.low <= last.low);
    const isContained = (curr.high <= last.high && curr.low >= last.low);
    
    if (isContaining || isContained) {
      const isUpTrend = merged.length >= 2 ? last.high > merged[merged.length - 2].high : curr.close > curr.open;
      
      if (isUpTrend) {
        last.high = Math.max(last.high, curr.high);
        last.low = Math.max(last.low, curr.low);
      } else {
        last.high = Math.min(last.high, curr.high);
        last.low = Math.min(last.low, curr.low);
      }
      last.originalIndices.push(i);
    } else {
      merged.push({
        time: curr.time,
        high: curr.high,
        low: curr.low,
        open: curr.open,
        close: curr.close,
        originalIndices: [i],
      });
    }
  }
  
  return merged;
}

/**
 * 检测底分型
 */
function findBottomFenXing(merged: MergedCandle[]): boolean {
  if (merged.length < 3) return false;
  
  for (let i = merged.length - 3; i < merged.length - 1; i++) {
    if (i < 1) continue;
    
    const prev = merged[i - 1];
    const curr = merged[i];
    const next = merged[i + 1];
    
    // 底分型:中间K线最低
    if (curr.low < prev.low && curr.low < next.low &&
        curr.high < prev.high && curr.high < next.high) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检测底背离
 */
function checkBottomDivergence(candles: Candle[], diffValues: number[]): boolean {
  if (candles.length < 10) return false;
  
  // 查找最近两个低点
  let lowPoints: Array<{ index: number; price: number; diff: number }> = [];
  
  for (let i = 1; i < candles.length - 1; i++) {
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      lowPoints.push({
        index: i,
        price: candles[i].low,
        diff: diffValues[i],
      });
    }
  }
  
  if (lowPoints.length < 2) return false;
  
  // 取最近两个低点
  const recent = lowPoints.slice(-2);
  const [prev, curr] = recent;
  
  // 价格创新低,但DIFF没有创新低
  return curr.price < prev.price && curr.diff > prev.diff && curr.diff < 0;
}

/**
 * 检测缠论分型+底背离信号(优先级3)
 */
function checkChanLunSignal(candles: Candle[]): number {
  if (candles.length < 10) return 0;
  
  const merged = mergeCandles(candles);
  const hasBottomFenXing = findBottomFenXing(merged);
  
  if (!hasBottomFenXing) return 0;
  
  const { diff } = calculateMACD(candles);
  const hasDivergence = checkBottomDivergence(candles, diff);
  
  if (hasDivergence) {
    return 100; // 底分型+底背离,满分
  }
  
  return 50; // 只有底分型
}

// ============ 买卖动能指标 ============

/**
 * 检测买卖动能信号(优先级4)
 * 条件:黄线穿绿线且绿柱转红柱
 */
function checkMomentumSignal(candles: Candle[]): number {
  if (candles.length < 20) return 0;
  
  // 计算买卖动能
  const buyMomentum: number[] = [];
  const sellMomentum: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const priceChange = c.close - c.open;
    const priceChangeRatio = priceChange / c.open;
    const volumeWeight = c.volume || 1;
    
    let buy = 0;
    let sell = 0;
    
    if (priceChange > 0) {
      buy = priceChangeRatio * volumeWeight * 1000;
    } else if (priceChange < 0) {
      sell = Math.abs(priceChangeRatio) * volumeWeight * 1000;
    }
    
    // EMA平滑
    if (i > 0) {
      buy = buyMomentum[i - 1] * 0.9 + buy * 0.1;
      sell = sellMomentum[i - 1] * 0.9 + sell * 0.1;
    }
    
    buyMomentum.push(buy);
    sellMomentum.push(sell);
  }
  
  // 计算黄线(买入动能EMA)和绿线(卖出动能EMA)
  const yellowLine = ema(buyMomentum, 5);
  const greenLine = ema(sellMomentum, 5);
  
  const last = candles.length - 1;
  const prev = last - 1;
  
  // 黄线穿绿线
  const yellowCrossGreen = yellowLine[last] > greenLine[last] && yellowLine[prev] <= greenLine[prev];
  
  // 绿柱转红柱(卖出动能减弱,买入动能增强)
  const barTurnRed = (buyMomentum[last] - sellMomentum[last]) > 0 && 
                     (buyMomentum[prev] - sellMomentum[prev]) <= 0;
  
  if (yellowCrossGreen && barTurnRed) {
    return 100;
  }
  
  if (yellowCrossGreen || barTurnRed) {
    return 60;
  }
  
  return 0;
}

// ============ 获取多时间级别K线数据 ============

async function fetchCandles(symbol: string, interval: string, range: string): Promise<Candle[]> {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: { interval, range },
      timeout: 10000,
    });
    
    const result = response.data?.chart?.result?.[0];
    if (!result) return [];
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0];
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close[i] !== null) {
        candles.push({
          time: timestamps[i],
          open: quotes.open[i] || quotes.close[i],
          high: quotes.high[i] || quotes.close[i],
          low: quotes.low[i] || quotes.close[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || 0,
        });
      }
    }
    
    return candles;
  } catch (error) {
    console.error(`Failed to fetch candles for ${symbol} (${interval}):`, error);
    return [];
  }
}

// ============ 综合评分系统 ============

export interface RecommendationScore {
  symbol: string;
  totalScore: number;
  priority1Score: number; // 梯子穿越
  priority2Score: number; // 禅动指标
  priority3Score: number; // 缠论分型
  priority4Score: number; // 买卖动能
  price: number;
  changePercent: number;
  reason: string;
}

export async function calculateRecommendationScore(symbol: string): Promise<RecommendationScore | null> {
  try {
    // 获取多时间级别K线数据
    const [candles30m, candles1h, candles2h, candles3h, candles4h, candlesDaily] = await Promise.all([
      fetchCandles(symbol, '30m', '5d'),
      fetchCandles(symbol, '1h', '1mo'),
      fetchCandles(symbol, '2h', '2mo'),
      fetchCandles(symbol, '3h', '3mo'),
      fetchCandles(symbol, '4h', '6mo'),
      fetchCandles(symbol, '1d', '1y'),
    ]);
    
    if (candles30m.length === 0) return null;
    
    // 优先级1:梯子穿越(30分钟+多时间级别)
    const ladder30m = calculateLadder(candles30m);
    const priority1Score = checkLadderCross(candles30m, ladder30m) * 0.7 + 
                          checkMultiTimeframeLadder(candles4h, candles3h, candles2h, candles1h) * 0.3;
    
    // 优先级2:禅动指标(多时间级别)
    let priority2Score = 0;
    if (candlesDaily.length > 0) priority2Score += checkCDSignal(candlesDaily) * 0.4;
    if (candles4h.length > 0) priority2Score += checkCDSignal(candles4h) * 0.3;
    if (candles2h.length > 0) priority2Score += checkCDSignal(candles2h) * 0.2;
    if (candles1h.length > 0) priority2Score += checkCDSignal(candles1h) * 0.1;
    
    // 优先级3:缠论分型(日线+4小时)
    let priority3Score = 0;
    if (candlesDaily.length > 0) priority3Score += checkChanLunSignal(candlesDaily) * 0.6;
    if (candles4h.length > 0) priority3Score += checkChanLunSignal(candles4h) * 0.4;
    
    // 优先级4:买卖动能
    const priority4Score = checkMomentumSignal(candles30m);
    
    // 综合评分(加权)
    const totalScore = priority1Score * 0.4 + 
                      priority2Score * 0.3 + 
                      priority3Score * 0.2 + 
                      priority4Score * 0.1;
    
    // 获取当前价格和涨跌幅
    const lastCandle = candles30m[candles30m.length - 1];
    const firstCandle = candles30m[0];
    const changePercent = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
    
    // 生成推荐理由
    const reasons: string[] = [];
    if (priority1Score > 70) reasons.push('梯子穿越信号强');
    if (priority2Score > 70) reasons.push('禅动指标买入');
    if (priority3Score > 70) reasons.push('底分型+底背离');
    if (priority4Score > 70) reasons.push('买卖动能转强');
    
    const reason = reasons.length > 0 ? reasons.join('、') : '技术指标综合评分';
    
    return {
      symbol,
      totalScore,
      priority1Score,
      priority2Score,
      priority3Score,
      priority4Score,
      price: lastCandle.close,
      changePercent,
      reason,
    };
  } catch (error) {
    console.error(`Failed to calculate score for ${symbol}:`, error);
    return null;
  }
}
