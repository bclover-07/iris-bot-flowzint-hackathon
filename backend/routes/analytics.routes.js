import { Router } from 'express';
import { getAnalyticsDashboard, getSecurityDashboard } from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/overview', authenticate, getAnalyticsDashboard);
router.get('/security', authenticate, getSecurityDashboard);

export default router;
