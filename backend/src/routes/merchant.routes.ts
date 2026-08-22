import { Router } from 'express';
import { getSummary, getTransactions } from '../controllers/merchant.controller';

const router = Router();

router.get('/summary', getSummary);
router.get('/transactions', getTransactions);

export default router;
