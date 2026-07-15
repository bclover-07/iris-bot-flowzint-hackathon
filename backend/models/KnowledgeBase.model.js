import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['education', 'support', 'troubleshooting', 'onboarding', 'policy', 'general'],
    default: 'general' 
  },
  source: { type: String, default: 'knowledge-base' },
  embedding: { type: [Number], default: [] },
}, { timestamps: true });

knowledgeBaseSchema.index({ category: 1 });

export const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
