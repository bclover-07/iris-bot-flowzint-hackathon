import rateLimit from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many requests. Please wait before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many authentication attempts, please try again later.' },
  validate: { trustProxy: false, xForwardedForHeader: false },
});

export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many OTP requests, please try again later.' },
  validate: { trustProxy: false, xForwardedForHeader: false },
});
