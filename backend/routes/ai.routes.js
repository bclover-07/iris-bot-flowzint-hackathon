import { Router } from 'express';
import { handleAIChat, getChatHistory } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.post('/chat', authenticate, aiRateLimit, handleAIChat);
router.get('/history/:sessionId', authenticate, getChatHistory);
export default router;
