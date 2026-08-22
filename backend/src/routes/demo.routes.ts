import { Router } from 'express';
import { resetDemo } from '../controllers/demo.controller';

const router = Router();

router.post('/reset', resetDemo);

export default router;
