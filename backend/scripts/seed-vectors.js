import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedKnowledgeBase } from '../services/rag.service.js';

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iris';
  console.log(`[Seeder] Connecting to MongoDB: ${mongoUri}...`);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('[Seeder] MongoDB connected.');
    
    // Seed RAG knowledge base
    await seedKnowledgeBase();
    
    console.log('[Seeder] Completed successfully.');
  } catch (err) {
    console.error('[Seeder] Error run seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Seeder] Database connection closed.');
    process.exit(0);
  }
}

run();
