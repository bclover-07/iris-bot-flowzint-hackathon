import { Router } from 'express';
import { generateQuiz, submitQuizAnswers, getUserQuizzes } from '../controllers/quiz.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.get('/history', authenticate, getUserQuizzes);
router.post('/generate', authenticate, aiRateLimit, generateQuiz);
router.post('/submit', authenticate, submitQuizAnswers);
export default router;
