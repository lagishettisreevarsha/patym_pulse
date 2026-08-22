import { Request, Response } from 'express';
import { paytmProvider } from '../services/paytm';
import { runAnalytics } from '../analytics/analytics.engine';
import { logger } from '../utils/logger';

export const getSummary = async (req: Request, res: Response) => {
  try {
    const merchantId = (req.query.merchantId as string) || 'demo-merchant-1';
    logger.info(`getSummary - Fetching summary for merchant: ${merchantId}`);

    // Fetch merchant details
    const merchant = await paytmProvider.getMerchantSummary(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Fetch transactions (last 30 days for baseline calculations)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const transactions = await paytmProvider.getTransactions(merchantId, startDate, new Date());

    // Run deterministic analytics calculations
    const analytics = runAnalytics(transactions);
    
    // Get business signals status
    const signalsInfo = await paytmProvider.getBusinessSignals(merchantId, startDate, new Date());

    return res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        businessType: merchant.business_type,
        preferredLanguage: merchant.preferred_language,
      },
      ...analytics,
      providerInfo: signalsInfo
    });
  } catch (error) {
    logger.error('getSummary - Error calculating summary', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const merchantId = (req.query.merchantId as string) || 'demo-merchant-1';
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const page = parseInt(req.query.page as string, 10) || 1;
    
    logger.info(`getTransactions - Fetching transactions for merchant: ${merchantId}, limit: ${limit}, page: ${page}`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // limit to last 30 days of data for the API

    const allTxns = await paytmProvider.getTransactions(merchantId, startDate, new Date());
    
    // Sort descending by timestamp for list view
    const sortedTxns = [...allTxns].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedTxns = sortedTxns.slice(offset, offset + limit);

    return res.json({
      transactions: paginatedTxns,
      pagination: {
        total: allTxns.length,
        limit,
        page,
        pages: Math.ceil(allTxns.length / limit),
      }
    });
  } catch (error) {
    logger.error('getTransactions - Error fetching transactions', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
