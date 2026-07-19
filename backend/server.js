import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocketService } from './services/socket.service.js';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import careerRoutes from './routes/career.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import sttRoutes from './routes/stt.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();
await connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true }
});

initSocketService(io);

app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

import mongoose from 'mongoose';
import { isEmbeddingModelReady } from './services/embedding.service.js';
import { isSentimentModelReady } from './services/sentiment.service.js';

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const embeddingReady = isEmbeddingModelReady();
  const sentimentReady = isSentimentModelReady();
  const isHealthy = dbStatus === 'connected';
  
  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      localEmbeddingModel: embeddingReady ? 'ready' : 'loading_or_failed',
      localSentimentModel: sentimentReady ? 'ready' : 'loading_or_failed'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/stt', sttRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`IRIS Bot backend running on port ${PORT}`));
