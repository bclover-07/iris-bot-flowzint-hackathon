import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  promptSnippet: { type: String, required: true },
  threatLevel: { type: String, enum: ['clean', 'suspicious', 'blocked'], default: 'clean' },
  detectionLayer: { type: String, enum: ['local', 'piguard', 'response'], required: true },
  matchedPatterns: [{
    category: String,
    label: String,
    severity: Number,
  }],
  heuristicFlags: [{
    flag: String,
    detail: String,
    severity: Number,
  }],
  confidence: { type: Number, default: 0 },
  action: { type: String, enum: ['blocked', 'monitored', 'passed'], required: true },
  cost: { type: Number, default: 0 },
});

export const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
