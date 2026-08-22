import axios from 'axios';
import { config } from '../../config/env.config';
import { logger } from '../../utils/logger';

export interface BusinessExplanation {
  headline: string;
  observation: string;
  why_it_matters: string;
  recommendation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  supporting_metrics: string[];
}

export class SarvamService {
  private readonly apiUrl = 'https://api.sarvam.ai/v1/chat/completions';
  private readonly modelName = 'sarvam-105b';

  /**
   * Generates a natural language explanation of calculated signals using Sarvam AI.
   */
  async getBusinessExplanation(
    merchantName: string,
    businessType: string,
    signals: any[]
  ): Promise<BusinessExplanation> {
    const fallbackExplanation = this.getFallbackExplanation(signals);

    if (!config.SARVAM_API_KEY) {
      logger.warn('Sarvam API Key is not set. Using deterministic fallback explanation.');
      return fallbackExplanation;
    }

    try {
      logger.info('Calling Sarvam AI Chat Completions API...');
      
      const systemPrompt = `You are a business decision-support assistant for small Indian businesses. 
Explain observed business patterns using ONLY the provided data. 
Never invent metrics, transactions, customers, products, or causes that are not supported by the input. 
Clearly distinguish observed facts from interpretation. 
Give practical, conservative recommendations. 
Keep the explanation simple enough for a non-technical small-business owner.

You MUST respond ONLY with a single JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json. The JSON object structure MUST be:
{
  "headline": "A short, engaging title summarizing what changed (max 6-8 words)",
  "observation": "What changed? A simple sentence describing the observed change.",
  "why_it_matters": "Why does it matter? An explanation of the business impact using numbers from the input.",
  "recommendation": "What to do next? A practical, conservative action the merchant can take.",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "supporting_metrics": ["A list of 2-3 key metric values that support this observation"]
}`;

      const userPrompt = `Merchant Details:
- Name: ${merchantName}
- Business Type: ${businessType}

Detected Business Signals (Calculated from Transaction History):
${JSON.stringify(signals, null, 2)}

Provide the structured decision-support JSON response. Do not invent any numbers. All statistics in your response must be derived from the signals above.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 800
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': config.SARVAM_API_KEY
          },
          timeout: 8000 // 8 seconds timeout
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty content from Sarvam AI');
      }

      logger.info('Successfully received response from Sarvam AI.');
      const parsedExplanation = this.parseCleanJson(content);
      return {
        ...fallbackExplanation, // default fallbacks
        ...parsedExplanation // override with AI output
      };
    } catch (error: any) {
      logger.error('Error calling Sarvam AI. Falling back to deterministic analysis.', error.message || error);
      return fallbackExplanation;
    }
  }

  /**
   * Answers a natural language query about the merchant's metrics using Sarvam AI.
   */
  async answerBusinessQuery(
    merchantName: string,
    query: string,
    analyticsResult: any
  ): Promise<any> {
    const fallbackAnswer = this.getFallbackAnswer(query, analyticsResult);

    if (!config.SARVAM_API_KEY) {
      logger.warn('Sarvam API Key is not set. Using deterministic fallback answer.');
      return fallbackAnswer;
    }

    try {
      logger.info(`Calling Sarvam AI for question: "${query}"`);

      const systemPrompt = `You are a helpful business analytics assistant for a small Indian merchant named "${merchantName}" who runs a "${analyticsResult.summary ? 'store' : 'business'}".
Answer the user's question using ONLY the provided business statistics.
Never invent any numbers, transactions, customers, or items. 
If the information is not present in the statistics, state clearly that you do not have that data.
Keep the answer concise (2-3 sentences), simple, and practical.

You MUST respond ONLY with a single JSON object. Do not wrap the JSON in markdown code blocks. The JSON structure MUST be:
{
  "answer": "Your concise text response answering the query.",
  "groundedMetrics": {
    "totalSales": number (from input),
    "totalTransactions": number (from input),
    "avgTransactionValue": number (from input)
  }
}`;

      const userPrompt = `Merchant Name: ${merchantName}
Question: ${query}

Business Statistics:
- Total Sales This Week: ₹${analyticsResult.summary.totalSales}
- Total Transactions This Week: ${analyticsResult.summary.totalTransactions}
- Average Transaction Value: ₹${analyticsResult.summary.avgTransactionValue}
- Sales Change: ${analyticsResult.summary.salesChangePercent}%
- Transaction Count Change: ${analyticsResult.summary.transactionsChangePercent}%
- Average Transaction Size Change: ${analyticsResult.summary.avgValueChangePercent}%
- Detected Signals: ${JSON.stringify(analyticsResult.signals, null, 2)}
- Daily Sales/Counts (Last 7 Days): ${JSON.stringify(analyticsResult.dailyTrend, null, 2)}
- Payment Method Split: ${JSON.stringify(analyticsResult.paymentMethods, null, 2)}

Provide the structured answer JSON.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': config.SARVAM_API_KEY
          },
          timeout: 6000 // 6 seconds timeout
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty content from Sarvam AI');
      }

      logger.info('Successfully received query response from Sarvam AI.');
      const parsedQuery = this.parseCleanJson(content);
      return {
        ...fallbackAnswer,
        ...parsedQuery
      };
    } catch (error: any) {
      logger.error('Error calling Sarvam AI for query. Falling back to deterministic answer.', error.message || error);
      return fallbackAnswer;
    }
  }

  /**
   * Helper to clean markdown json blocks if returned by the LLM
   */
  private parseCleanJson(text: string): any {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      // Remove starting ```json or ```
      cleanText = cleanText.replace(/^```(json)?\s*/i, '');
      // Remove ending ```
      cleanText = cleanText.replace(/\s*```$/, '');
    }
    return JSON.parse(cleanText.trim());
  }

  /**
   * Deterministic template generator for business explanation fallback.
   */
  private getFallbackExplanation(signals: any[]): BusinessExplanation {
    const eveningSignal = signals.find(s => s.metric === 'evening_transactions');
    const salesSignal = signals.find(s => s.metric === 'sales_performance');
    const ticketSignal = signals.find(s => s.metric === 'average_ticket_size');

    let headline = 'Sales Performance Stable';
    let observation = 'Your store operations are running within typical historical baselines.';
    let why_it_matters = 'No significant deviations detected in your checkout or traffic patterns this week.';
    let recommendation = 'Maintain current operating hours and product displays.';
    let supporting_metrics: string[] = [];

    if (eveningSignal && eveningSignal.change_percent < -15) {
      headline = 'Evening Store Footfall is Down';
      observation = `Your evening transactions (6 PM - 10 PM) decreased by ${Math.abs(eveningSignal.change_percent)}% this week.`;
      why_it_matters = `You completed ${eveningSignal.current_value} checkout payments this week compared to a weekly baseline average of ${Math.round(eveningSignal.baseline_value)} during evenings. This indicates a drop in customer footfall during peak post-work hours.`;
      recommendation = 'Consider launching targeted digital coupon promotions or happy hour bundles between 6 PM and 9 PM to encourage evening visits.';
      supporting_metrics = [
        `Current Week Evening Transactions: ${eveningSignal.current_value}`,
        `Historical Weekly Baseline: ${Math.round(eveningSignal.baseline_value)}`,
        `Evening Volume Drop: ${eveningSignal.change_percent}%`
      ];
    } else if (salesSignal && salesSignal.change_percent > 15) {
      headline = 'Sales Surge Detected!';
      observation = `Weekly sales increased by ${salesSignal.change_percent}% to ₹${salesSignal.current_value}.`;
      why_it_matters = `Your weekly sales of ₹${salesSignal.current_value} significantly exceeded your typical baseline average of ₹${salesSignal.baseline_value}.`;
      recommendation = 'Ensure you have sufficient inventory of popular items to sustain this growth.';
      supporting_metrics = [
        `Weekly Sales: ₹${salesSignal.current_value}`,
        `Baseline Sales: ₹${salesSignal.baseline_value}`
      ];
    }

    if (ticketSignal && ticketSignal.change_percent > 5) {
      recommendation += ` Continue pushing checkout combos, as your average ticket size grew by ${ticketSignal.change_percent}% to ₹${ticketSignal.current_value}.`;
    }

    return {
      headline,
      observation,
      why_it_matters,
      recommendation,
      confidence: 'HIGH',
      supporting_metrics,
    };
  }

  /**
   * Deterministic template generator for business query answers.
   */
  private getFallbackAnswer(query: string, analyticsResult: any): any {
    const normalizedQuery = query.toLowerCase();
    let answer = '';

    if (normalizedQuery.includes('evening') || normalizedQuery.includes('6 pm') || normalizedQuery.includes('night')) {
      const ev = analyticsResult.signals.find((s: any) => s.metric === 'evening_transactions');
      if (ev) {
        answer = `Evening transactions (6 PM to 10 PM) dropped by ${Math.abs(ev.change_percent)}% compared to your historical baseline. This week you had ${ev.current_value} evening checkouts vs the baseline average of ${Math.round(ev.baseline_value)}.`;
      } else {
        answer = `Your evening transaction counts are currently stable and in line with your historical baseline.`;
      }
    } else if (normalizedQuery.includes('weekend') || normalizedQuery.includes('saturday') || normalizedQuery.includes('sunday')) {
      const we = analyticsResult.signals.find((s: any) => s.metric === 'weekend_performance');
      if (we) {
        answer = `Your weekend daily transactions average ${we.current_value} per day, which is ${we.change_percent}% higher than the typical baseline of ${we.baseline_value} transactions. Weekends are a key revenue driver.`;
      } else {
        answer = `Weekend sales are stable. Weekends contribute a healthy share of transaction counts.`;
      }
    } else if (normalizedQuery.includes('how is my business') || normalizedQuery.includes('sales') || normalizedQuery.includes('this week') || normalizedQuery.includes('summary') || normalizedQuery.includes('doing')) {
      answer = `This week, your business generated total sales of ₹${analyticsResult.summary.totalSales} across ${analyticsResult.summary.totalTransactions} transactions, with an average ticket size of ₹${analyticsResult.summary.avgTransactionValue}. This represents a sales growth of ${analyticsResult.summary.salesChangePercent}% compared to the baseline.`;
    } else if (normalizedQuery.includes('average') || normalizedQuery.includes('order size') || normalizedQuery.includes('ticket')) {
      answer = `Your average transaction value is ₹${analyticsResult.summary.avgTransactionValue} this week, which represents a change of ${analyticsResult.summary.avgValueChangePercent}% from the previous periods.`;
    } else {
      answer = `Your business is showing strong sales of ₹${analyticsResult.summary.totalSales} this week across ${analyticsResult.summary.totalTransactions} transactions. Average transaction size is ₹${analyticsResult.summary.avgTransactionValue}. Let me know if you would like details on weekend patterns or evening sales.`;
    }

    return {
      answer,
      groundedMetrics: {
        totalSales: analyticsResult.summary.totalSales,
        totalTransactions: analyticsResult.summary.totalTransactions,
        avgTransactionValue: analyticsResult.summary.avgTransactionValue,
      }
    };
  }
}
