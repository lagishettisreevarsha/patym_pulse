import { prisma } from '../../config/db';

export async function seedDemoData() {
  console.log('Starting seed process...');

  // 1. Clear existing data
  await prisma.businessInsight.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.merchant.deleteMany({});

  console.log('Database cleared.');

  // 2. Create Demo Merchant
  const merchantId = 'demo-merchant-1';
  const merchant = await prisma.merchant.create({
    data: {
      id: merchantId,
      name: 'Karan Kirana Store',
      business_type: 'Groceries & Retail',
      preferred_language: 'en',
    },
  });

  console.log(`Created merchant: ${merchant.name} (${merchant.id})`);

  // 3. Generate Transactions for the last 30 days
  const transactionsData: any[] = [];
  const now = new Date();
  
  const getPaymentMethod = () => {
    const rand = Math.random();
    if (rand < 0.70) return 'UPI';
    if (rand < 0.90) return 'WALLET';
    return 'CARD';
  };

  const getStatus = () => {
    return Math.random() < 0.96 ? 'SUCCESS' : 'FAILED';
  };

  // Generate 30 days of data
  for (let i = 29; i >= 0; i--) {
    const currentDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCurrentWeek = i < 7;
    const isAnomalyDay = i === 4; // Wednesday

    let transactionCount = 25 + Math.floor(Math.random() * 15);
    if (isWeekend) {
      transactionCount += 15;
    }
    if (isAnomalyDay) {
      transactionCount = 95;
    }

    let baseAmount = 150;
    if (isWeekend) baseAmount = 180;
    if (isCurrentWeek) baseAmount += 50;

    for (let t = 0; t < transactionCount; t++) {
      let hour = 8 + Math.floor(Math.random() * 14);
      
      const randHour = Math.random();
      if (randHour < 0.35) {
        hour = 8 + Math.floor(Math.random() * 3);
      } else if (randHour < 0.50) {
        hour = 12 + Math.floor(Math.random() * 5);
      } else {
        hour = 17 + Math.floor(Math.random() * 5);
      }

      // Suppress evening transactions on all current week days
      if (isCurrentWeek) {
        if (hour >= 18 && hour <= 21) {
          if (Math.random() < 0.80) {
            hour = 10 + Math.floor(Math.random() * 4);
          }
        }
      }

      const txTimestamp = new Date(currentDate.getTime());
      txTimestamp.setHours(hour);
      txTimestamp.setMinutes(Math.floor(Math.random() * 60));
      txTimestamp.setSeconds(Math.floor(Math.random() * 60));

      let amount = baseAmount * (0.4 + Math.random() * 1.5);
      if (isAnomalyDay) {
        amount = amount * 1.3;
      }
      
      amount = Math.round(amount * 100) / 100;

      transactionsData.push({
        merchant_id: merchantId,
        external_transaction_id: `TXN${txTimestamp.getFullYear()}${String(txTimestamp.getMonth() + 1).padStart(2, '0')}${String(txTimestamp.getDate()).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`,
        amount,
        status: getStatus(),
        payment_method: getPaymentMethod(),
        timestamp: txTimestamp,
      });
    }
  }

  console.log(`Generating ${transactionsData.length} transactions...`);
  
  await prisma.transaction.createMany({
    data: transactionsData,
  });

  console.log('Seeded transactions.');

  // Create initial insights
  await prisma.businessInsight.createMany({
    data: [
      {
        merchant_id: merchantId,
        insight_type: 'weekend_rush',
        headline: 'Weekend Rush Pattern',
        observation: 'Your Saturday and Sunday sales are 45% higher than weekdays.',
        explanation: 'Weekend footfall and higher card transactions between 12 PM and 4 PM drive this surge.',
        recommendation: 'Ensure your checkout desk is fully staffed and UPI QR codes are clean and visible on Saturdays.',
        confidence: 'HIGH',
        created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        merchant_id: merchantId,
        insight_type: 'high_ticket',
        headline: 'Average Ticket Size Up',
        observation: 'Average transaction size increased from ₹152 to ₹208 this week.',
        explanation: 'The shift is driven by an increase in items purchased per checkout, likely due to checkout combos.',
        recommendation: 'Continue highlighting checkout combo deals near the counter.',
        confidence: 'MEDIUM',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      }
    ]
  });

  console.log('Seeded insights. Seed complete.');
  return { merchantId, transactionsCount: transactionsData.length };
}
