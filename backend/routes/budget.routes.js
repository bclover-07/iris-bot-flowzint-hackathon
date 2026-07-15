import { Router } from 'express';
import { getBudgetStats, resetBudgetHandler } from '../controllers/budget.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/stats/:sessionId', authenticate, getBudgetStats);
router.post('/reset/:sessionId', authenticate, resetBudgetHandler);
export default router;
