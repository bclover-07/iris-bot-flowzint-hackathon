import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { synthesizeSpeech } from '../services/tts.service.js';

const router = Router();

/**
 * POST /api/tts/synthesize
 * Body: { text: string, voiceId?: string, speed?: number }
 * Returns: audio/wav binary stream
 */
router.post('/synthesize', authenticate, async (req, res, next) => {
  try {
    const { text, voiceId, speed } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { audioBuffer, latencyMs, charCount } = await synthesizeSpeech(text, {
      voiceId,
      speed,
    });

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'X-TTS-Latency-Ms': latencyMs.toString(),
      'X-TTS-Char-Count': charCount.toString(),
      'Cache-Control': 'no-cache',
    });

    return res.send(audioBuffer);
  } catch (err) {
    console.warn('[TTS Route]', err.message);
    // If TTS fails for any reason (key not set, invalid key, 401 unauthorized, etc.)
    // return a graceful fallback signal so the frontend uses browser SpeechSynthesis
    return res.status(503).json({
      error: 'TTS service unavailable',
      details: err.message,
      fallback: true,
    });
  }
});

export default router;
