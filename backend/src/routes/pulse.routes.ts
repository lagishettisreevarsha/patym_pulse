import { Router } from 'express';
import { getPulse, queryPulse, getHistory } from '../controllers/pulse.controller';

const router = Router();

router.get('/', getPulse);
router.post('/query', queryPulse);
router.get('/history', getHistory);

export default router;
