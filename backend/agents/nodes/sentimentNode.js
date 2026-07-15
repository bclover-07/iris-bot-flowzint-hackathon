import { analyzeSentiment } from '../../services/sentiment.service.js';
import { emitRoutingEvent } from '../../services/socket.service.js';

/**
 * Node that runs local sentiment analysis on user query.
 * Adapts agent behavior parameters based on user frustration level.
 */
export async function sentimentNode(state) {
  const { message, sessionId, userId } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

  emitRoutingEvent(trackingId, {
    type: 'routing_step',
    step: 1,
    status: 'analyzing',
    message: 'Analyzing user sentiment and emotional tone...',
    timestamp: new Date().toISOString()
  });

  const sentiment = await analyzeSentiment(message);
  
  // Also emit sentiment event to the frontend
  emitRoutingEvent(trackingId, {
    type: 'sentiment_detected',
    sentiment,
    timestamp: new Date().toISOString()
  });

  return {
    sentiment,
    trace: ['sentimentNode']
  };
}
