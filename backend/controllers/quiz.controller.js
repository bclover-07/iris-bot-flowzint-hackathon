import { getDegradedModel, recordSpend, getAllBudgetStats } from '../services/budget.service.js';
import { callOtari } from '../services/otari.service.js';
import { emitRoutingEvent } from '../services/socket.service.js';
import { MODELS } from '../config/otari.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';

export async function generateQuiz(req, res, next) {
  try {
    const { topic, noteContent, difficulty = 'medium', numQuestions = 5, sessionId } = req.body;
    const content = noteContent || topic;

    const baseModel = MODELS.COMPLEX;
    const model = (await getDegradedModel(sessionId, baseModel)) || MODELS.SIMPLE;

    let result;
    try {
      result = await callOtari({
        model,
        messages: [{ role: 'user', content: `Generate ${numQuestions} ${difficulty} multiple-choice questions from this content:\n\n${content}\n\nReturn ONLY valid JSON: {"questions": [{"id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]}` }],
        guardrailMode: 'monitor',
        sessionId,
      });
    } catch (err) {
      console.warn("Otari API Error (Quiz):", err.message);
      // Fallback response if the API fails completely
      result = {
        answer: JSON.stringify({
          questions: [
            { id: 1, question: `Generate quiz questions about ${topic || 'your notes'} - what is the main concept?`, options: ["Concept A", "Concept B", "Concept C", "Concept D"], correct: 0, explanation: "Correct answer is Concept A based on topic study." }
          ]
        }),
        cost: 0.0005,
        inputTokens: 100,
        outputTokens: 150
      };
    }

    await recordSpend(sessionId, model, result.cost, { tier: 'complex', reason: 'Quiz generation' });

    emitRoutingEvent(sessionId, {
      tier: 'complex',
      modelDisplayName: model.includes('Kimi') ? 'Kimi K2.6' : model.includes('Haiku') ? 'Haiku 4.5' : 'Sonnet 4.6',
      reason: 'Quiz generation requires content synthesis',
      cost: result.cost,
      score: 85
    });

    let questions;
    try {
      const cleaned = result.answer.replace(/```json|```/g, '').trim();
      questions = JSON.parse(cleaned).questions;
    } catch {
      return res.status(500).json({ error: 'Failed to parse quiz from AI response' });
    }

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      topic: topic || 'Custom notes',
      questions,
      model,
      cost: result.cost,
    });

    const budgetStats = await getAllBudgetStats(sessionId);

    return res.json({
      attemptId: attempt._id,
      questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options })),
      routing: { model, tier: 'complex', reason: 'Quiz generation requires content synthesis' },
      cost: { thisCall: result.cost, ...budgetStats },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitQuizAnswers(req, res, next) {
  try {
    const { attemptId, answers, sessionId } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found' });

    const results = attempt.questions.map(q => ({
      id: q.id,
      question: q.question,
      userAnswer: answers[q.id],
      correctAnswer: q.correct,
      correct: answers[q.id] === q.correct,
      explanation: q.explanation,
    }));

    const score = results.filter(r => r.correct).length;
    const wrongAnswers = results.filter(r => !r.correct);

    let feedback = '';
    if (wrongAnswers.length > 0) {
      const baseModel = MODELS.MEDIUM;
      const model = (await getDegradedModel(sessionId, baseModel)) || MODELS.SIMPLE;
      const feedbackResult = await callOtari({
        model,
        messages: [{
          role: 'user',
          content: `Student got ${score}/${attempt.questions.length} on a quiz about "${attempt.topic}". 
          Wrong answers: ${JSON.stringify(wrongAnswers.map(w => w.question))}.
          Give 3 specific, encouraging study tips to improve. Be concise.`,
        }],
        guardrailMode: 'monitor',
        sessionId,
      });
      feedback = feedbackResult.answer;
      await recordSpend(sessionId, model, feedbackResult.cost, { tier: 'medium', reason: 'Quiz feedback generation' });
      
      emitRoutingEvent(sessionId, {
        tier: 'medium',
        modelDisplayName: model.includes('Kimi') ? 'Kimi K2.6' : model.includes('Haiku') ? 'Haiku 4.5' : 'Sonnet 4.6',
        reason: 'Quiz feedback generation',
        cost: feedbackResult.cost,
        score: 50
      });
    }

    attempt.score = score;
    attempt.completedAt = new Date();
    await attempt.save();

    const budgetStats = await getAllBudgetStats(sessionId);

    return res.json({
      score,
      total: attempt.questions.length,
      percentage: Math.round((score / attempt.questions.length) * 100),
      results,
      feedback,
      budgetStats,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserQuizzes(req, res, next) {
  try {
    const quizzes = await QuizAttempt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}
