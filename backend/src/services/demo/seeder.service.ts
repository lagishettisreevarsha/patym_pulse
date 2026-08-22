import { prisma } from '../../config/db';

export async function seedDemoData() {
  console.log('Starting seed process...');

  // 1. Clear existing data
  await prisma.businessInsight.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.merchant.deleteMany({});

  console.log('Database cleared.');

  // 2. Create Demo Merchants
  const merchants = [
    {
      id: 'demo-merchant-1',
      name: 'Karan Kirana Store',
      business_type: 'Groceries & Retail',
      preferred_language: 'en',
    },
    {
      id: 'demo-merchant-2',
      name: 'Sharma Sweets & Cafe',
      business_type: 'Food & Beverage',
      preferred_language: 'en',
    },
    {
      id: 'demo-merchant-3',
      name: 'Pooja Boutiques',
      business_type: 'Fashion & Apparel',
      preferred_language: 'en',
    }
  ];

  for (const m of merchants) {
    await prisma.merchant.create({ data: m });
    console.log(`Created merchant: ${m.name} (${m.id})`);
  }

  const transactionsData: any[] = [];
  const insightsData: any[] = [];
  const now = new Date();

  // Helper for payment method
  const getPaymentMethod = (merchantType: string) => {
    const rand = Math.random();
    if (merchantType === 'Fashion & Apparel') {
      if (rand < 0.40) return 'UPI';
      if (rand < 0.90) return 'CARD';
      return 'WALLET';
    }
    // Groceries and Food
    if (rand < 0.75) return 'UPI';
    if (rand < 0.93) return 'WALLET';
    return 'CARD';
  };

  const getStatus = () => {
    return Math.random() < 0.97 ? 'SUCCESS' : 'FAILED';
  };

  // Generate 30 days of data for each merchant
  for (let i = 29; i >= 0; i--) {
    const currentDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCurrentWeek = i < 7;

    // --- MERCHANT 1: Karan Kirana Store (Groceries & Retail) ---
    // Has evening drop anomaly in the current week
    {
      const isAnomalyDay = i === 4; // Wednesday
      let transactionCount = 22 + Math.floor(Math.random() * 12);
      if (isWeekend) transactionCount += 12;
      if (isAnomalyDay) transactionCount = 92;

      let baseAmount = 140;
      if (isWeekend) baseAmount = 175;
      if (isCurrentWeek) baseAmount += 45;

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

        // Suppress evening transactions on current week
        if (isCurrentWeek && hour >= 18 && hour <= 21) {
          if (Math.random() < 0.80) {
            hour = 10 + Math.floor(Math.random() * 4);
          }
        }

        const txTimestamp = new Date(currentDate.getTime());
        txTimestamp.setHours(hour);
        txTimestamp.setMinutes(Math.floor(Math.random() * 60));
        txTimestamp.setSeconds(Math.floor(Math.random() * 60));

        let amount = baseAmount * (0.45 + Math.random() * 1.4);
        if (isAnomalyDay) amount = amount * 1.35;
        amount = Math.round(amount * 100) / 100;

        transactionsData.push({
          merchant_id: 'demo-merchant-1',
          external_transaction_id: `TXN1${txTimestamp.getFullYear()}${String(txTimestamp.getMonth() + 1).padStart(2, '0')}${String(txTimestamp.getDate()).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`,
          amount,
          status: getStatus(),
          payment_method: getPaymentMethod('Groceries & Retail'),
          timestamp: txTimestamp,
        });
      }
    }

    // --- MERCHANT 2: Sharma Sweets & Cafe (Food & Beverage) ---
    // Has weekend rush pattern (60% higher on Sat/Sun)
    {
      const isAnomalyDay = i === 12; // 12 days ago peak rush
      let transactionCount = 35 + Math.floor(Math.random() * 20);
      if (isWeekend) transactionCount = Math.floor(transactionCount * 1.6);
      if (isAnomalyDay) transactionCount = 120;

      let baseAmount = 85; // Low ticket size typical of cafes
      if (isWeekend) baseAmount = 110;
      if (isCurrentWeek) baseAmount += 20;

      for (let t = 0; t < transactionCount; t++) {
        // Peaks at lunch hours (12-3 PM) and evening snacks (4-7 PM)
        let hour = 9 + Math.floor(Math.random() * 12);
        const randHour = Math.random();
        if (randHour < 0.40) {
          hour = 12 + Math.floor(Math.random() * 3); // 12-3 PM lunch
        } else if (randHour < 0.80) {
          hour = 16 + Math.floor(Math.random() * 3); // 4-7 PM tea/snacks
        }

        const txTimestamp = new Date(currentDate.getTime());
        txTimestamp.setHours(hour);
        txTimestamp.setMinutes(Math.floor(Math.random() * 60));
        txTimestamp.setSeconds(Math.floor(Math.random() * 60));

        let amount = baseAmount * (0.5 + Math.random() * 1.3);
        if (isAnomalyDay) amount = amount * 1.5;
        amount = Math.round(amount * 100) / 100;

        transactionsData.push({
          merchant_id: 'demo-merchant-2',
          external_transaction_id: `TXN2${txTimestamp.getFullYear()}${String(txTimestamp.getMonth() + 1).padStart(2, '0')}${String(txTimestamp.getDate()).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`,
          amount,
          status: getStatus(),
          payment_method: getPaymentMethod('Food & Beverage'),
          timestamp: txTimestamp,
        });
      }
    }

    // --- MERCHANT 3: Pooja Boutiques (Fashion & Apparel) ---
    // High Ticket Size (₹1,500 average), fewer transactions (3-7 daily)
    {
      const isAnomalyDay = i === 10;
      let transactionCount = 3 + Math.floor(Math.random() * 5);
      if (isWeekend) transactionCount += 4;
      if (isAnomalyDay) transactionCount = 18;

      let baseAmount = 1450;
      if (isWeekend) baseAmount = 1950;
      if (isCurrentWeek) baseAmount += 300;

      for (let t = 0; t < transactionCount; t++) {
        // Evening shopping peaks
        let hour = 11 + Math.floor(Math.random() * 9); // 11 AM - 8 PM
        const randHour = Math.random();
        if (randHour < 0.60) {
          hour = 16 + Math.floor(Math.random() * 4); // 4 PM - 8 PM peak
        }

        const txTimestamp = new Date(currentDate.getTime());
        txTimestamp.setHours(hour);
        txTimestamp.setMinutes(Math.floor(Math.random() * 60));
        txTimestamp.setSeconds(Math.floor(Math.random() * 60));

        let amount = baseAmount * (0.6 + Math.random() * 1.6);
        if (isAnomalyDay) amount = amount * 1.4;
        amount = Math.round(amount * 100) / 100;

        transactionsData.push({
          merchant_id: 'demo-merchant-3',
          external_transaction_id: `TXN3${txTimestamp.getFullYear()}${String(txTimestamp.getMonth() + 1).padStart(2, '0')}${String(txTimestamp.getDate()).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`,
          amount,
          status: getStatus(),
          payment_method: getPaymentMethod('Fashion & Apparel'),
          timestamp: txTimestamp,
        });
      }
    }
  }

  console.log(`Generating ${transactionsData.length} transactions across 3 profiles...`);
  
  await prisma.transaction.createMany({
    data: transactionsData,
  });

  console.log('Seeded transactions.');

  // Create initial insights for all 3 merchants
  insightsData.push(
    // Merchant 1 (Kirana)
    {
      merchant_id: 'demo-merchant-1',
      insight_type: 'weekend_rush',
      headline: 'Weekend Rush Pattern',
      observation: 'Your Saturday and Sunday sales are 45% higher than weekdays.',
      explanation: 'Weekend footfall and higher card transactions between 12 PM and 4 PM drive this surge.',
      recommendation: 'Ensure your checkout desk is fully staffed and UPI QR codes are clean and visible on Saturdays.',
      confidence: 'HIGH',
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      merchant_id: 'demo-merchant-1',
      insight_type: 'high_ticket',
      headline: 'Average Ticket Size Up',
      observation: 'Average transaction size increased from ₹152 to ₹208 this week.',
      explanation: 'The shift is driven by an increase in items purchased per checkout, likely due to checkout combos.',
      recommendation: 'Continue highlighting checkout combo deals near the counter.',
      confidence: 'MEDIUM',
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    // Merchant 2 (Cafe)
    {
      merchant_id: 'demo-merchant-2',
      insight_type: 'weekend_rush',
      headline: 'Weekend Lunch Rush Surge',
      observation: 'Weekend sales count is 60% higher than weekdays, peaking at lunch hours.',
      explanation: 'Large orders for lunch combos and special sweets drive this weekend volume.',
      recommendation: 'Pre-prepare high-volume sweet boxes and keep UPI checkout lines moving during 12 PM - 3 PM.',
      confidence: 'HIGH',
      created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
    // Merchant 3 (Boutique)
    {
      merchant_id: 'demo-merchant-3',
      insight_type: 'high_ticket',
      headline: 'Weekend High-Value Sales',
      observation: 'Your average boutique transaction size grew to ₹2,250 during weekends.',
      explanation: 'Apparel orders peak during weekend afternoons when shopping traffic is high.',
      recommendation: 'Ensure premium apparel displays are refreshed on Saturday mornings and active cards are processed quickly.',
      confidence: 'HIGH',
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    }
  );

  await prisma.businessInsight.createMany({
    data: insightsData,
  });

  console.log('Seeded insights. Seed complete.');
  return { transactionsCount: transactionsData.length };
}
