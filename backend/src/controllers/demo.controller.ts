import { Request, Response } from 'express';
import { seedDemoData } from '../services/demo/seeder.service';
import { logger } from '../utils/logger';

export const resetDemo = async (req: Request, res: Response) => {
  try {
    logger.info('resetDemo - Triggering demo data reset/re-seed...');
    const result = await seedDemoData();
    return res.json({
      success: true,
      message: 'Demo data has been reset and seeded successfully.',
      ...result
    });
  } catch (error) {
    logger.error('resetDemo - Error resetting demo data', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
