import { searchKnowledgeBase, getCachedResponse } from '../../services/rag.service.js';
import { getAllBudgetStats } from '../../services/budget.service.js';
import { emitRoutingEvent } from '../../services/socket.service.js';

/**
 * Node that performs semantic query caching and RAG search in parallel.
 * Stores result in state if found, skipping downstream LLM generation.
 */
export async function ragNode(state) {
  const { message, sessionId, userId } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');
  const socketRoomId = sessionId || 'demo-session-id';

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 3,
    status: 'analyzing',
    message: 'Searching local knowledge base and query caches...',
    timestamp: new Date().toISOString()
  });

  const budgetStatsBefore = await getAllBudgetStats(trackingId);

  // 1. Zero-Cost Semantic Caching / RAG
  const ragResult = await searchKnowledgeBase(message);
  if (ragResult && ragResult.score > 0.55) {
    const isHighConfidence = ragResult.score > 0.85;
    const routing = {
      model: isHighConfidence ? 'Local KB (Direct)' : 'Local KB + LLM',
      tier: isHighConfidence ? 'cached' : 'enhanced',
      reason: isHighConfidence 
        ? `Answered directly from vector knowledge base (High confidence: ${Math.round(ragResult.score * 100)}%)`
        : `Retrieved context from vector knowledge base (Score: ${Math.round(ragResult.score * 100)}%) to feed into LLM`,
      score: Math.round(ragResult.score * 100),
      modelDisplayName: isHighConfidence ? 'Local KB' : 'RAG Pipeline',
      degraded: false,
      budgetMode: budgetStatsBefore.mode,
    };

    emitRoutingEvent(socketRoomId, {
      type: 'routing_step',
      step: 3,
      status: 'done',
      message: isHighConfidence
        ? `KB Match: Direct Answer (Score: ${Math.round(ragResult.score * 100)}%)`
        : `KB Match: Context Retrieved (Score: ${Math.round(ragResult.score * 100)}%)`,
      data: { source: 'knowledge-base', score: ragResult.score, direct: isHighConfidence },
      timestamp: new Date().toISOString()
    });

    return {
      retrievedContext: {
        answer: ragResult.answer, // Note: storing inside retrievedContext so LLM can read it
        source: 'knowledge-base',
        routing,
        cost: {
          thisCall: 0,
          thisCallFormatted: '$0.000000',
          spent: budgetStatsBefore.spent,
          remaining: budgetStatsBefore.remaining,
          percentUsed: budgetStatsBefore.percentUsed,
          mode: budgetStatsBefore.mode,
        },
      },
      answer: isHighConfidence ? ragResult.answer : undefined,
      trace: ['ragNode']
    };
  }

  // 2. Query Cache
  const cachedResponse = getCachedResponse(message);
  if (cachedResponse) {
    emitRoutingEvent(socketRoomId, {
      type: 'routing_step',
      step: 3,
      status: 'done',
      message: 'Semantic Cache Match: Direct Answer ($0.00)',
      data: { source: 'cache' },
      timestamp: new Date().toISOString()
    });

    return {
      retrievedContext: {
        ...cachedResponse,
        source: 'cache',
        cost: {
          thisCall: 0,
          thisCallFormatted: '$0.000000',
          spent: budgetStatsBefore.spent,
          remaining: budgetStatsBefore.remaining,
          percentUsed: budgetStatsBefore.percentUsed,
          mode: budgetStatsBefore.mode,
        },
      },
      answer: cachedResponse.answer,
      trace: ['ragNode']
    };
  }

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 3,
    status: 'done',
    message: 'KB Search: No match (Score < 55%)',
    data: { source: 'miss' },
    timestamp: new Date().toISOString()
  });

  return {
    trace: ['ragNode']
  };
}
