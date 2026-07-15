import { Router } from 'express';
import { analyzeCareer } from '../controllers/career.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.post('/analyze', authenticate, aiRateLimit, analyzeCareer);
export default router;
