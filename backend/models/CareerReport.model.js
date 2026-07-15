import mongoose from 'mongoose';

const careerReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeSnippet: String,
  paths: [{
    title: String,
    timeframe: String,
    salaryRange: String,
    skills: [String],
    steps: [String],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  }],
  model: String,
  cost: Number,
  createdAt: { type: Date, default: Date.now },
});

export const CareerReport = mongoose.model('CareerReport', careerReportSchema);
