import mongoose from 'mongoose';

const budgetTrackerSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  spent: { type: Number, default: 0 },
  calls: { type: Number, default: 0 },
  blockedCalls: { type: Number, default: 0 },
  history: [{
    timestamp: Date,
    model: String,
    cost: Number,
    tier: String,
    score: Number,
    reason: String,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const BudgetTracker = mongoose.model('BudgetTracker', budgetTrackerSchema);
