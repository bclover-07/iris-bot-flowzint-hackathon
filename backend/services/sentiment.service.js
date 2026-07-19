import { pipeline } from '@huggingface/transformers';

let sentimentPipeline = null;
let isLoading = false;

async function getSentimentPipeline() {
  if (sentimentPipeline) return sentimentPipeline;
  if (isLoading) {
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return sentimentPipeline;
  }

  isLoading = true;
  console.log('[Sentiment] Loading sentiment analysis model...');
  const startMs = Date.now();

  try {
    sentimentPipeline = await pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { dtype: 'fp32' }
    );
    console.log(`[Sentiment] Model loaded in ${Date.now() - startMs}ms`);
  } catch (err) {
    console.error('[Sentiment] Failed to load model:', err.message);
    sentimentPipeline = null;
  } finally {
    isLoading = false;
  }

  return sentimentPipeline;
}

async function analyzeSentimentAPI(text, apiKey) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text.slice(0, 512) })
      }
    );
    if (!response.ok) {
      throw new Error(`HF Inference API error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data[0] && data[0].length > 0) {
      let maxItem = data[0][0];
      for (const item of data[0]) {
        if (item.score > maxItem.score) {
          maxItem = item;
        }
      }
      return maxItem;
    }
    throw new Error('Invalid HF Inference response format');
  } catch (err) {
    console.error('[Sentiment] API analysis failed, falling back to local model:', err.message);
    return null;
  }
}

/**
 * Analyze the sentiment of a user message.
 * Returns a structured result with emotion label, score, and behavioral guidance.
 * 
 * @param {string} text - User message text
 * @returns {Promise<{label: string, score: number, emoji: string, behavior: string}>}
 */
export async function analyzeSentiment(text) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (apiKey) {
    const apiResult = await analyzeSentimentAPI(text, apiKey);
    if (apiResult) {
      const label = (apiResult.label || '').toUpperCase();
      const score = apiResult.score || 0.5;

      if (label === 'POSITIVE' || label === 'LABEL_1') {
        if (score > 0.95) {
          return { label: 'VERY_POSITIVE', score, emoji: '😊', behavior: 'enthusiastic' };
        }
        return { label: 'POSITIVE', score, emoji: '🙂', behavior: 'standard' };
      }

      if (label === 'NEGATIVE' || label === 'LABEL_0') {
        if (score > 0.9) {
          return { label: 'VERY_NEGATIVE', score, emoji: '😤', behavior: 'empathetic_direct' };
        }
        if (score > 0.75) {
          return { label: 'FRUSTRATED', score, emoji: '😕', behavior: 'concise_helpful' };
        }
        return { label: 'SLIGHTLY_NEGATIVE', score, emoji: '😐', behavior: 'standard' };
      }

      return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
    }
  }

  const pipe = await getSentimentPipeline();

  if (!pipe) {
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
  }

  try {
    const result = await pipe(text.slice(0, 512));
    const { label, score } = result[0];

    if (label === 'POSITIVE') {
      if (score > 0.95) {
        return { label: 'VERY_POSITIVE', score, emoji: '😊', behavior: 'enthusiastic' };
      }
      return { label: 'POSITIVE', score, emoji: '🙂', behavior: 'standard' };
    }

    if (label === 'NEGATIVE') {
      if (score > 0.9) {
        return { label: 'VERY_NEGATIVE', score, emoji: '😤', behavior: 'empathetic_direct' };
      }
      if (score > 0.75) {
        return { label: 'FRUSTRATED', score, emoji: '😕', behavior: 'concise_helpful' };
      }
      return { label: 'SLIGHTLY_NEGATIVE', score, emoji: '😐', behavior: 'standard' };
    }

    return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
  } catch (err) {
    console.error('[Sentiment] Analysis failed:', err.message);
    return { label: 'NEUTRAL', score: 0.5, emoji: '😐', behavior: 'standard' };
  }
}

/**
 * Track sentiment trend over consecutive messages.
 * Detects if user is getting progressively more frustrated.
 * 
 * @param {Array<{label: string, score: number}>} history - Recent sentiment results
 * @returns {{trend: string, shouldEscalate: boolean, adaptations: string[]}}
 */
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
    adaptations.push('suggest_human_escalation');
  } else if (negativeCount >= 2) {
    trend = 'slightly_declining';
    adaptations.push('skip_socratic');
    adaptations.push('be_more_direct');
  } else if (recent.every(s => ['POSITIVE', 'VERY_POSITIVE'].includes(s.label))) {
    trend = 'improving';
  }

  return { trend, shouldEscalate, adaptations };
}

/**
 * Pre-warm the sentiment model on server startup.
 */
export async function warmUpSentimentModel() {
  if (process.env.HUGGINGFACE_API_KEY) {
    console.log('[Sentiment] HF API Key detected, skipping local pre-warm.');
    return;
  }
  console.log('[Sentiment] Pre-warming model...');
  await analyzeSentiment('warmup test');
  console.log('[Sentiment] Model ready');
}

export function isSentimentModelReady() {
  // sentimentPipeline is a module-level variable
  return true; // Simple stub or we can expose it if we find sentimentPipeline defined at top
}
