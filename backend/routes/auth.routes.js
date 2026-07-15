import { Router } from 'express';
import { register, verifyOTP, resendOTP, login, logout, getMe, sendLoginOTP, verifyLoginOTP } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimit, otpRateLimit } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/verify-otp', otpRateLimit, verifyOTP);
router.post('/resend-otp', otpRateLimit, resendOTP);
router.post('/login', authRateLimit, login);
router.post('/login/send-otp', otpRateLimit, sendLoginOTP);
router.post('/login/verify-otp', otpRateLimit, verifyLoginOTP);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
