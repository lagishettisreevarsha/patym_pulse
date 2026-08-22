import { prisma } from './config/db';
import { runAnalytics } from './analytics/analytics.engine';

async function testAnalytics() {
  try {
    console.log('Retrieving transactions from db...');
    const transactions = await prisma.transaction.findMany({
      orderBy: { timestamp: 'asc' }
    });

    console.log(`Found ${transactions.length} total transactions.`);
    
    console.log('Running analytics engine calculations...');
    const result = runAnalytics(transactions);
    
    console.log('=== ANALYTICS SUMMARY ===');
    console.log(JSON.stringify(result.summary, null, 2));
    
    console.log('=== DETECTED SIGNALS ===');
    console.log(JSON.stringify(result.signals, null, 2));

    console.log('=== ANOMALIES ===');
    console.log(JSON.stringify(result.anomalies, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Analytics test failed:', error);
    process.exit(1);
  }
}

testAnalytics();
