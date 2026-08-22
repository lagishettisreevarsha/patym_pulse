import { Request, Response } from 'express';
import { paytmProvider } from '../services/paytm';
import { sarvamService } from '../services/ai';
import { runAnalytics } from '../analytics/analytics.engine';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export const getPulse = async (req: Request, res: Response) => {
  try {
    const merchantId = (req.query.merchantId as string) || 'demo-merchant-1';
    logger.info(`getPulse - Fetching pulse for merchant: ${merchantId}`);

    const merchant = await paytmProvider.getMerchantSummary(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Fetch transactions
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const transactions = await paytmProvider.getTransactions(merchantId, startDate, new Date());

    // Calculate signals
    const analytics = runAnalytics(transactions);

    // Call Sarvam AI to interpret the signals
    const explanation = await sarvamService.getBusinessExplanation(
      merchant.name,
      merchant.business_type,
      analytics.signals
    );

    // Save insight to history in database (avoid duplicating identical headlines on the same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingInsight = await prisma.businessInsight.findFirst({
      where: {
        merchant_id: merchantId,
        headline: explanation.headline,
        created_at: {
          gte: today,
        }
      }
    });

    if (!existingInsight) {
      await prisma.businessInsight.create({
        data: {
          merchant_id: merchantId,
          insight_type: analytics.signals[0]?.metric || 'normal',
          headline: explanation.headline,
          observation: explanation.observation,
          explanation: explanation.why_it_matters,
          recommendation: explanation.recommendation,
          confidence: explanation.confidence,
        }
      });
      logger.info('getPulse - New insight saved to history.');
    }

    return res.json({
      merchantId,
      ...explanation,
      meta: {
        mode: 'DEMO_DATA',
        signalsAnalyzed: analytics.signals.length,
        disclaimer: 'Demo Data Provider is used until the official Paytm technical integration is complete.'
      }
    });
  } catch (error) {
    logger.error('getPulse - Error generating pulse insight', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const queryPulse = async (req: Request, res: Response) => {
  try {
    const merchantId = (req.body.merchantId as string) || 'demo-merchant-1';
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    logger.info(`queryPulse - Question: "${question}" for merchant: ${merchantId}`);

    const merchant = await paytmProvider.getMerchantSummary(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Retrieve analytics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const transactions = await paytmProvider.getTransactions(merchantId, startDate, new Date());
    const analytics = runAnalytics(transactions);

    // Get response from Sarvam
    const reply = await sarvamService.answerBusinessQuery(
      merchant.name,
      question,
      analytics
    );

    return res.json(reply);
  } catch (error) {
    logger.error('queryPulse - Error answering query', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const merchantId = (req.query.merchantId as string) || 'demo-merchant-1';
    logger.info(`getHistory - Fetching history for merchant: ${merchantId}`);

    const insights = await prisma.businessInsight.findMany({
      where: {
        merchant_id: merchantId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.json({ insights });
  } catch (error) {
    logger.error('getHistory - Error retrieving historical insights', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
