import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { authenticate } from '../middlewares/auth.middleware.js';
import { otariClient, MODELS } from '../config/otari.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // temporary storage

router.post('/pdf', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);

    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error in pdf route:", e);
      }
    }

    return res.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch(e) {}
    }
    next(err);
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
        extractedText = "Error: Could not extract text from PDF. It might be a scanned image or protected.";
      }
    } else if (mimeType.startsWith('image/') || req.file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        
        const response = await otariClient.chat.completions.create({
          model: MODELS.COMPLEX,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all the text and data from this image exactly as written. If there is a diagram, describe it. Do not hallucinate or add conversational filler.' },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ]
        });
        extractedText = response.choices[0].message.content || '';
      } catch (ocrErr) {
        console.error("Otari OCR Error:", ocrErr);
        extractedText = "Error: Could not extract text from the image using Otari AI.";
      }
    } else {
      // Treat as plain text
      try {
        extractedText = fs.readFileSync(req.file.path, 'utf-8');
      } catch (txtErr) {
        extractedText = "Error: Could not read text file.";
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
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

export default router;
