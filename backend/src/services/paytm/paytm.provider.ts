import { Merchant, Transaction } from '@prisma/client';

export interface PaytmDataProvider {
  /**
   * Retrieves transactions for a merchant within a given date range.
   */
  getTransactions(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]>;

  /**
   * Retrieves merchant demographic and preferences.
   */
  getMerchantSummary(merchantId: string): Promise<Merchant | null>;

  /**
   * Retrieves business signals/insights saved in the database or calculated dynamically.
   */
  getBusinessSignals(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any>;
}
