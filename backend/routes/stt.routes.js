import express from 'express';
import multer from 'multer';
import { transcribeSpeech } from '../services/stt.service.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Transcribe audio file to text via Smallest.ai
router.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided in "file" field.' });
    }

    const transcript = await transcribeSpeech(req.file.buffer, req.file.originalname);

    res.json({ text: transcript });
  } catch (error) {
    console.error('STT API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

export default router;
