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

  emitRoutingEvent(trackingId, {
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
    const routing = {
      model: 'Local KB + LLM',
      tier: 'enhanced',
      reason: `Retrieved context from vector knowledge base (Score: ${Math.round(ragResult.score * 100)}%) to feed into LLM`,
      score: Math.round(ragResult.score * 100),
      modelDisplayName: 'RAG Pipeline',
      degraded: false,
      budgetMode: budgetStatsBefore.mode,
    };

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
      // Removed root answer so graph doesn't skip LLM
      trace: ['ragNode']
    };
  }

  // 2. Query Cache
  const cachedResponse = getCachedResponse(message);
  if (cachedResponse) {
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

  return {
    trace: ['ragNode']
  };
}
