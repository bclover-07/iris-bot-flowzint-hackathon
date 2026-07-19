import { Router } from 'express';
import { analyzeCareer, getUserCareers } from '../controllers/career.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.get('/history', authenticate, getUserCareers);
router.post('/analyze', authenticate, aiRateLimit, analyzeCareer);
export default router;
