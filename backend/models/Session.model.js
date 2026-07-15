import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  routing: {
    model: String,
    tier: String,
    score: Number,
    reason: String,
    degraded: Boolean,
  },
  cost: Number,
  costSavings: {
    actualCost: Number,
    worstCaseCost: Number,
    saved: Number,
    savedPercent: Number,
  },
  tokens: {
    input: Number,
    output: Number,
  },
  latencyMs: Number,
  injectionStatus: { type: String, enum: ['clean', 'blocked', 'monitor'], default: 'clean' },
  sentiment: {
    label: String,
    score: Number,
    emoji: String,
    behavior: String,
  },
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Session = mongoose.model('Session', sessionSchema);
