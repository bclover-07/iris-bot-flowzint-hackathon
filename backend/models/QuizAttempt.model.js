import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  questions: [{
    id: Number,
    question: String,
    options: [String],
    correct: Number,
    explanation: String,
  }],
  score: { type: Number, default: null },
  model: String,
  cost: Number,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
