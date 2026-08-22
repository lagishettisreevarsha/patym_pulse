import { Transaction } from '@prisma/client';

export interface AnalyticsSignal {
  metric: string;
  display_name: string;
  current_value: number;
  baseline_value: number;
  change_percent: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  context_description: string;
}

export interface DailyMetrics {
  date: string;
  sales: number;
  count: number;
}

export interface HourlyMetrics {
  hour: number;
  sales: number;
  count: number;
}

export interface BusinessAnalyticsResult {
  summary: {
    totalSales: number;
    totalTransactions: number;
    avgTransactionValue: number;
    salesChangePercent: number;
    transactionsChangePercent: number;
    avgValueChangePercent: number;
  };
  signals: AnalyticsSignal[];
  dailyTrend: DailyMetrics[];
  hourlyTrend: HourlyMetrics[];
  paymentMethods: { method: string; count: number; percentage: number }[];
  anomalies: { date: string; type: 'HIGH' | 'LOW'; value: number; baselineMean: number; devFactor: number; description: string }[];
}

export function runAnalytics(
  transactions: Transaction[],
  nowDate: Date = new Date()
): BusinessAnalyticsResult {
  // 1. Separate current period (last 7 days) and baseline period (prior 21 days)
  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  
  const currentPeriodStart = new Date(nowDate.getTime() - 7 * MS_IN_DAY);
  const baselinePeriodStart = new Date(nowDate.getTime() - 28 * MS_IN_DAY);
  
  // Filter for transactions that are successful
  const successTxns = transactions.filter(t => t.status === 'SUCCESS');

  const currentTxns = successTxns.filter(t => new Date(t.timestamp) >= currentPeriodStart);
  const baselineTxns = successTxns.filter(
    t => new Date(t.timestamp) >= baselinePeriodStart && new Date(t.timestamp) < currentPeriodStart
  );

  // Helper: Basic calculations
  const getSalesSum = (txs: Transaction[]) => txs.reduce((sum, t) => sum + t.amount, 0);
  const getAvgValue = (txs: Transaction[]) => (txs.length > 0 ? getSalesSum(txs) / txs.length : 0);

  const currentSales = getSalesSum(currentTxns);
  const currentCount = currentTxns.length;
  const currentAvg = getAvgValue(currentTxns);

  // For baseline, we average per 7-day period to make comparison meaningful
  const baselineSalesAvg7Days = getSalesSum(baselineTxns) / 3;
  const baselineCountAvg7Days = baselineTxns.length / 3;
  const baselineAvgValue = getAvgValue(baselineTxns);

  const calculateChange = (current: number, baseline: number) => {
    if (baseline === 0) return 0;
    return Math.round(((current - baseline) / baseline) * 10000) / 100;
  };

  const salesChangePercent = calculateChange(currentSales, baselineSalesAvg7Days);
  const transactionsChangePercent = calculateChange(currentCount, baselineCountAvg7Days);
  const avgValueChangePercent = calculateChange(currentAvg, baselineAvgValue);

  // 2. Hourly patterns (aggregate over 0-23 hours for current and baseline)
  const hourlyCurrent = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, count: 0 }));
  const hourlyBaseline = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, count: 0 }));

  currentTxns.forEach(t => {
    const hr = new Date(t.timestamp).getHours();
    hourlyCurrent[hr].sales += t.amount;
    hourlyCurrent[hr].count += 1;
  });

  baselineTxns.forEach(t => {
    const hr = new Date(t.timestamp).getHours();
    hourlyBaseline[hr].sales += t.amount;
    hourlyBaseline[hr].count += 1;
  });

  // 3. Evening Drop calculation (6 PM - 9 PM, i.e., 18, 19, 20, 21)
  const eveningHours = [18, 19, 20, 21];
  const currentEveningTxCount = hourlyCurrent
    .filter(h => eveningHours.includes(h.hour))
    .reduce((sum, h) => sum + h.count, 0);
  
  const baselineEveningTxCountAvg7Days = (hourlyBaseline
    .filter(h => eveningHours.includes(h.hour))
    .reduce((sum, h) => sum + h.count, 0)) / 3;

  const eveningTxChangePercent = calculateChange(currentEveningTxCount, baselineEveningTxCountAvg7Days);

  // 4. Weekend vs Weekday patterns
  const getWeekendSplit = (txs: Transaction[]) => {
    let weekendSales = 0;
    let weekendCount = 0;
    let weekdaySales = 0;
    let weekdayCount = 0;

    txs.forEach(t => {
      const day = new Date(t.timestamp).getDay();
      const isWeekend = day === 0 || day === 6; // Sunday, Saturday
      if (isWeekend) {
        weekendSales += t.amount;
        weekendCount++;
      } else {
        weekdaySales += t.amount;
        weekdayCount++;
      }
    });

    return { weekendSales, weekendCount, weekdaySales, weekdayCount };
  };

  const currentSplit = getWeekendSplit(currentTxns);
  const baselineSplit = getWeekendSplit(baselineTxns);

  // Normalized weekday vs weekend transaction rates (per day average)
  // Current week has 2 weekend days and 5 weekdays
  const currentWeekendDailyCount = currentSplit.weekendCount / 2;
  const currentWeekdayDailyCount = currentSplit.weekdayCount / 5;

  // Baseline has 6 weekend days and 15 weekdays (21 days)
  const baselineWeekendDailyCount = baselineSplit.weekendCount / 6;
  const baselineWeekdayDailyCount = baselineSplit.weekdayCount / 15;

  const weekendCountChangePercent = calculateChange(currentWeekendDailyCount, baselineWeekendDailyCount);

  // 5. Outlier/Anomaly Detection (Daily Sales over last 30 days)
  // Group all successful transactions by date (YYYY-MM-DD)
  const dailySalesMap = new Map<string, number>();
  
  // Initialize map for all 30 days to ensure zero-sales days are captured
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    dailySalesMap.set(dateStr, 0);
  }

  successTxns.forEach(t => {
    const dateStr = new Date(t.timestamp).toISOString().split('T')[0];
    if (dailySalesMap.has(dateStr)) {
      dailySalesMap.set(dateStr, (dailySalesMap.get(dateStr) || 0) + t.amount);
    }
  });

  const dailyTrend: DailyMetrics[] = [];
  dailySalesMap.forEach((sales, dateStr) => {
    const count = successTxns.filter(
      t => new Date(t.timestamp).toISOString().split('T')[0] === dateStr
    ).length;
    dailyTrend.push({ date: dateStr, sales: Math.round(sales * 100) / 100, count });
  });

  // Calculate mean and std dev of baseline daily sales
  const baselineDailySales = dailyTrend
    .filter(d => new Date(d.date) < currentPeriodStart)
    .map(d => d.sales);

  const baselineMean = baselineDailySales.reduce((s, v) => s + v, 0) / (baselineDailySales.length || 1);
  const variance = baselineDailySales.reduce((s, v) => s + Math.pow(v - baselineMean, 2), 0) / (baselineDailySales.length || 1);
  const stdDev = Math.sqrt(variance);

  const anomalies: BusinessAnalyticsResult['anomalies'] = [];
  const currentDailyTrend = dailyTrend.filter(d => new Date(d.date) >= currentPeriodStart);

  currentDailyTrend.forEach(day => {
    const dev = day.sales - baselineMean;
    const devFactor = stdDev > 0 ? dev / stdDev : 0;

    if (devFactor > 1.5) {
      anomalies.push({
        date: day.date,
        type: 'HIGH',
        value: day.sales,
        baselineMean: Math.round(baselineMean * 100) / 100,
        devFactor: Math.round(devFactor * 100) / 100,
        description: `Sales on ${day.date} were significantly higher than typical (₹${day.sales} vs typical avg of ₹${Math.round(baselineMean)}).`
      });
    } else if (devFactor < -1.5) {
      anomalies.push({
        date: day.date,
        type: 'LOW',
        value: day.sales,
        baselineMean: Math.round(baselineMean * 100) / 100,
        devFactor: Math.round(devFactor * 100) / 100,
        description: `Sales on ${day.date} were significantly lower than typical (₹${day.sales} vs typical avg of ₹${Math.round(baselineMean)}).`
      });
    }
  });

  // 6. Payment method stats
  const methodMap = new Map<string, number>();
  currentTxns.forEach(t => {
    methodMap.set(t.payment_method, (methodMap.get(t.payment_method) || 0) + 1);
  });

  const totalCurrentTxns = currentTxns.length || 1;
  const paymentMethods = Array.from(methodMap.entries()).map(([method, count]) => ({
    method,
    count,
    percentage: Math.round((count / totalCurrentTxns) * 10000) / 100,
  })).sort((a, b) => b.count - a.count);

  // 7. Compile structured analytics signals for AI consumption
  const signals: AnalyticsSignal[] = [];

  // Signal A: Sales Trend
  signals.push({
    metric: 'sales_performance',
    display_name: 'Weekly Sales',
    current_value: Math.round(currentSales),
    baseline_value: Math.round(baselineSalesAvg7Days),
    change_percent: salesChangePercent,
    confidence: 'HIGH',
    context_description: `Total sales for this week is ₹${Math.round(currentSales)} compared to an weekly baseline average of ₹${Math.round(baselineSalesAvg7Days)}.`
  });

  // Signal B: Evening Transaction Drop (Main Shift seeded)
  if (eveningTxChangePercent < -15) {
    signals.push({
      metric: 'evening_transactions',
      display_name: 'Evening Store Footfall',
      current_value: Math.round(currentEveningTxCount),
      baseline_value: Math.round(baselineEveningTxCountAvg7Days),
      change_percent: eveningTxChangePercent,
      confidence: 'HIGH',
      context_description: `Evening transactions (6 PM - 10 PM) decreased by ${Math.abs(eveningTxChangePercent)}% compared to typical baseline evening traffic.`
    });
  }

  // Signal C: Average Ticket Size increase
  if (avgValueChangePercent > 5) {
    signals.push({
      metric: 'average_ticket_size',
      display_name: 'Average Order Value',
      current_value: Math.round(currentAvg),
      baseline_value: Math.round(baselineAvgValue),
      change_percent: avgValueChangePercent,
      confidence: 'HIGH',
      context_description: `The average checkout transaction amount grew by ${avgValueChangePercent}% to ₹${Math.round(currentAvg)}.`
    });
  }

  // Signal D: Weekend Rush
  if (currentSplit.weekendCount > 0) {
    const weekendVsWeekdayRatioCurrent = currentWeekendDailyCount / (currentWeekdayDailyCount || 1);
    signals.push({
      metric: 'weekend_performance',
      display_name: 'Weekend Store Traffic',
      current_value: Math.round(currentWeekendDailyCount),
      baseline_value: Math.round(baselineWeekendDailyCount),
      change_percent: weekendCountChangePercent,
      confidence: 'MEDIUM',
      context_description: `Weekend transactions averaged ${Math.round(currentWeekendDailyCount)} per day, compared to ${Math.round(currentWeekdayDailyCount)} per day on weekdays.`
    });
  }

  return {
    summary: {
      totalSales: Math.round(currentSales * 100) / 100,
      totalTransactions: currentCount,
      avgTransactionValue: Math.round(currentAvg * 100) / 100,
      salesChangePercent,
      transactionsChangePercent,
      avgValueChangePercent,
    },
    signals,
    dailyTrend: dailyTrend.slice(-7), // return last 7 days daily data
    hourlyTrend: hourlyCurrent,
    paymentMethods,
    anomalies,
  };
}
