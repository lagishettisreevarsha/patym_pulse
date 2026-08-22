import { Merchant, Transaction } from '@prisma/client';
import { PaytmDataProvider } from './paytm.provider';
import { prisma } from '../../config/db';

export class DemoPaytmDataProvider implements PaytmDataProvider {
  async getTransactions(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    const whereClause: any = {
      merchant_id: merchantId,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = startDate;
      }
      if (endDate) {
        whereClause.timestamp.lte = endDate;
      }
    }

    return prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async getMerchantSummary(merchantId: string): Promise<Merchant | null> {
    return prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
    });
  }

  async getBusinessSignals(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    // Return custom metadata signalling that we are in Demo Data Mode
    // and provide details on what parameters were checked.
    return {
      mode: 'DEMO_DATA',
      provider: 'DemoPaytmDataProvider',
      merchantId,
      queriedRange: {
        startDate: startDate ? startDate.toISOString() : 'all',
        endDate: endDate ? endDate.toISOString() : 'all',
      },
      integrationStatus: 'PENDING_OFFICIAL_APIS',
      disclaimer: 'Demo Data Provider is used until the official Paytm technical integration/resources are available.'
    };
  }
}
