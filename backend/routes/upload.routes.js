import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { authenticate } from '../middlewares/auth.middleware.js';
import { otariClient, MODELS } from '../config/otari.js';
import { analyzeImage } from '../services/gemini.service.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // temporary storage

router.post('/pdf', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    let textContent = '';
    let numPages = 0;
    let fileInfo = {};

    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      textContent = data.text;
      numPages = data.numpages;
      fileInfo = data.info;
    } catch (parseErr) {
      console.error("PDF Parsing failed. Falling back to notification text:", parseErr);
      textContent = '[Unable to extract text from this PDF automatically. Please paste your study notes here manually to generate the quiz.]';
    }

    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error in pdf route:", e);
      }
    }

    return res.json({
      text: textContent,
      pages: numPages,
      info: fileInfo,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch(e) {}
    }
    console.error("Unexpected error in PDF route:", err);
    return res.json({
      text: '[Unable to extract text from this PDF automatically. Please paste your study notes here manually to generate the quiz.]',
      pages: 0,
      info: {}
    });
  }
});

router.post('/document', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    const mimeType = req.file.mimetype;
    let extractedText = '';

    if (mimeType === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text || '';
      } catch (pdfErr) {
        console.error("PDF Parse Error:", pdfErr);
        extractedText = "We couldn't extract text from this PDF. It might be a scanned image or password-protected. Please copy/paste the content or upload a different document.";
      }
    } else if (mimeType.startsWith('image/') || req.file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        extractedText = await analyzeImage(
          imageBuffer,
          mimeType,
          'Extract all text, data, and details from this student document or diagram. If there is a diagram, explain it step-by-step.'
        );
      } catch (ocrErr) {
        console.error("Gemini Vision OCR Error:", ocrErr);
        extractedText = "We encountered a temporary issue analyzing the image. You can still ask your question or describe what is in the document.";
      }
    } else {
      // Treat as plain text
      try {
        extractedText = fs.readFileSync(req.file.path, 'utf-8');
      } catch (txtErr) {
        extractedText = "We couldn't read the text file. Please copy and paste its content directly.";
      }
    }

    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Temp file cleanup error:", unlinkErr);
      }
    }

    return res.json({ text: extractedText });
  } catch (err) {
    fs.writeFileSync('upload_error_log.txt', String(err.stack || err) + '\n\n');
    console.error("Upload Error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {}
    }
    return res.json({
      text: "We encountered a temporary server issue processing your attachment. You can still ask your question or try uploading it again."
    });
  }
});

export default router;
