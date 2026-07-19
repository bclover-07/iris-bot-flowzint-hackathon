import { analyzeSentiment, analyzeSentimentTrend } from '../../services/sentiment.service.js';
import { emitRoutingEvent } from '../../services/socket.service.js';

/**
 * Node that runs local sentiment analysis on user query.
 * Adapts agent behavior parameters based on user frustration level.
 */
export async function sentimentNode(state) {
  const { message, sessionId, userId, chatHistory = [] } = state;
  const socketRoomId = sessionId || 'demo-session-id';

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 1,
    status: 'analyzing',
    message: 'Analyzing user sentiment and emotional tone...',
    timestamp: new Date().toISOString()
  });

  const sentiment = await analyzeSentiment(message);
  
  // Extract sentiment labels from user message history
  const recentUserSentiments = chatHistory
    .filter(msg => msg.role === 'user' && msg.sentiment)
    .map(msg => msg.sentiment);
  
  recentUserSentiments.push(sentiment);
  const trendResult = analyzeSentimentTrend(recentUserSentiments);

  const finalSentiment = {
    ...sentiment,
    trend: trendResult.trend,
    shouldEscalate: trendResult.shouldEscalate,
    adaptations: trendResult.adaptations || [],
  };

  // Also emit sentiment event to the frontend
  emitRoutingEvent(socketRoomId, {
    type: 'sentiment_detected',
    sentiment: finalSentiment,
    timestamp: new Date().toISOString()
  });

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 1,
    status: 'done',
    message: `Sentiment: ${finalSentiment.label} (${finalSentiment.emoji}) · Trend: ${finalSentiment.trend}`,
    data: finalSentiment,
    timestamp: new Date().toISOString()
  });

  const outputs = {
    sentiment: finalSentiment,
    trace: ['sentimentNode']
  };

  // If sentiment trend indicates frustration, automatically degrade socratic stiffness
  if (trendResult.adaptations.includes('skip_socratic')) {
    outputs.socraticMode = false;
  }

  return outputs;
}
