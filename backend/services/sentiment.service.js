import dotenv from 'dotenv';
dotenv.config();

const POSITIVE_WORDS = new Set([
  'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'fantastic', 'wonderful',
  'amazing', 'perfect', 'thanks', 'thank', 'helpful', 'brilliant', 'super', 'nice',
  'best', 'cool', 'glad', 'enjoy', 'like', 'yay', 'correct', 'smart', 'clever'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'worst', 'horrible', 'hate', 'stupid', 'dumb', 'useless',
  'angry', 'frustrated', 'annoyed', 'fail', 'failed', 'error', 'wrong', 'broken',
  'sucks', 'slow', 'crash', 'rubbish', 'garbage', 'disappointed', 'upset', 'waste'
]);

/**
 * Perform high-speed zero-RAM lexicon sentiment analysis.
 * 
 * @param {string} text - User message text
 * @returns {Promise<{label: string, score: number, emoji: string, behavior: string}>}
 */
export async function analyzeSentiment(text) {
  if (!text) return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };

  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let posCount = 0;
  let negCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) posCount++;
    if (NEGATIVE_WORDS.has(word)) negCount++;
  }

  const total = posCount + negCount;
  if (total === 0) {
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
  }

  if (negCount > posCount) {
    const ratio = negCount / Math.max(1, words.length);
    if (negCount >= 3 || ratio > 0.4) {
      return { label: 'VERY_NEGATIVE', score: 0.95, emoji: '😤', behavior: 'empathetic_direct' };
    }
    if (negCount >= 2) {
      return { label: 'FRUSTRATED', score: 0.82, emoji: '😕', behavior: 'concise_helpful' };
    }
    return { label: 'SLIGHTLY_NEGATIVE', score: 0.65, emoji: '😐', behavior: 'standard' };
  }

  if (posCount > negCount) {
    if (posCount >= 3) {
      return { label: 'VERY_POSITIVE', score: 0.96, emoji: '😊', behavior: 'enthusiastic' };
    }
    return { label: 'POSITIVE', score: 0.85, emoji: '🙂', behavior: 'standard' };
  }

  return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
}

export function analyzeSentimentTrend(history) {
  if (!history || history.length < 2) {
    return { trend: 'stable', shouldEscalate: false, adaptations: [] };
  }

  const recent = history.slice(-5);
  const negativeCount = recent.filter(
    s => ['NEGATIVE', 'VERY_NEGATIVE', 'FRUSTRATED'].includes(s.label)
  ).length;

  const adaptations = [];
  let trend = 'stable';
  let shouldEscalate = false;

  if (negativeCount >= 3) {
    trend = 'declining';
    shouldEscalate = true;
    adaptations.push('skip_socratic');
    adaptations.push('add_empathy_prefix');
  } else if (negativeCount >= 2) {
    trend = 'slightly_declining';
    adaptations.push('skip_socratic');
  }

  return { trend, shouldEscalate, adaptations };
}

export async function warmUpSentimentModel() {
  console.log('[Sentiment Service] Zero-memory Lexicon Sentiment Analyzer initialized.');
}

export function isSentimentModelReady() {
  return true;
}
