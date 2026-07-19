import { Router } from 'express';
import { handleAIChat, handleAIChatStream, getChatHistory, getSessionSummary } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.post('/chat', authenticate, aiRateLimit, handleAIChat);
router.post('/chat/stream', authenticate, aiRateLimit, handleAIChatStream);
router.get('/history/:sessionId', authenticate, getChatHistory);
router.get('/summary/:sessionId', authenticate, getSessionSummary);
export default router;
