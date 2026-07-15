import { Router } from 'express';
import { generateQuiz, submitQuizAnswers } from '../controllers/quiz.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.post('/generate', authenticate, aiRateLimit, generateQuiz);
router.post('/submit', authenticate, submitQuizAnswers);
export default router;
