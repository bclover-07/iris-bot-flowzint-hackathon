import { classifyPrompt } from '../../services/classifier.service.js';
import { getBudgetMode, getDegradedModel, getAllBudgetStats } from '../../services/budget.service.js';
import { MODELS, MODEL_DISPLAY_NAMES } from '../../config/otari.js';
import { emitRoutingEvent } from '../../services/socket.service.js';
import { searchGrounded } from '../../services/gemini.service.js';
import { isModelDisabled } from '../../services/otari.service.js';

/**
 * Node that determines model routing tier, applies budget fallback policies,
 * and fetches web search context if triggered by classifier signals or user toggles.
 */
export async function toolRouterNode(state) {
  const { message, sessionId, userId, webSearchMode, sentiment } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');
  const socketRoomId = sessionId || 'demo-session-id';

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 4,
    status: 'routing',
    message: 'Evaluating query complexity & cost budget constraints...',
    timestamp: new Date().toISOString()
  });

  const budgetStatsBefore = await getAllBudgetStats(trackingId);

  // 1. Dynamic Prompt Classification
  const classification = classifyPrompt(message);
  const baseModel = MODELS[classification.tier.toUpperCase()];

  // 2. Budget Status & Graceful Degradation
  const budgetMode = await getBudgetMode(trackingId);
  if (budgetMode === 'exceeded') {
    return {
      budgetMode,
      answer: `Daily AI budget of $${budgetStatsBefore.total.toFixed(2)} has been reached. Please try again in a new session.`,
      trace: ['toolRouterNode']
    };
  }

  let selectedModel = await getDegradedModel(trackingId, baseModel);
  const degraded = selectedModel !== baseModel;
  
  let routingReason;
  if (degraded) {
    routingReason = `[BUDGET FALLBACK] ⚠️ ${budgetMode.toUpperCase()} mode! Downgraded from ${MODEL_DISPLAY_NAMES[baseModel]} to Budget ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`;
  } else {
    const tierName = classification.tier === 'simple' ? 'Budget' : 'Premium';
    routingReason = `[BUDGET HEALTHY] ✅ Sufficient funds ($${budgetStatsBefore.remaining.toFixed(2)} left). Safely routed to ${tierName} ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`;
  }

  // Sentiment adaptations: if user is frustrated, force direct answering tier (Haiku/Sonnet)
  // to avoid Kimi definitions or conversational fluff, if budget permits.
  if (sentiment && ['NEGATIVE', 'VERY_NEGATIVE', 'FRUSTRATED'].includes(sentiment.label) && !degraded) {
    if (selectedModel === 'mzai:moonshotai/Kimi-K2.6') {
      selectedModel = 'anthropic:claude-haiku-4-5';
      routingReason += ' [SENTIMENT ADAPTATION] User is frustrated. Upgraded model to Claude Haiku for precise explanation.';
    }
  }

  // --- OVERRIDE FOR EXPLICIT WEB SEARCH ---
  let webSearchResults = '';
  const needsWebSearch = classification.signals.needsWebSearch || webSearchMode;
  if (needsWebSearch) {
    selectedModel = MODELS.SIMPLE; // Force Mozilla Otari AI
    routingReason = `[WEB SEARCH ENABLED] 🌐 Routed to Mozilla Otari AI (${MODEL_DISPLAY_NAMES[selectedModel]}).`;
    
    emitRoutingEvent(socketRoomId, {
      type: 'routing_step',
      step: 4,
      status: 'routing',
      message: `Browsing live web for current references...`,
      timestamp: new Date().toISOString()
    });
    try {
      webSearchResults = await searchGrounded(message);
    } catch (searchErr) {
      console.warn('[toolRouterNode] Gemini Grounded Search failed, falling back to offline knowledge base:', searchErr.message);
      webSearchResults = '[SYSTEM: Live web search is temporarily unavailable due to API key restrictions. Please answer the user\'s query based on your existing knowledge base.]';
    }
  }

  // --- CIRCUIT BREAKER OVERRIDE ---
  if (isModelDisabled(selectedModel)) {
    const oldModelName = MODEL_DISPLAY_NAMES[selectedModel] || selectedModel;
    selectedModel = 'mzai:moonshotai/Kimi-K2.6';
    routingReason = `[Circuit Breaker] Routed to Kimi K2.6 because ${oldModelName} is offline/unsupported on this API key. ${routingReason}`;
  }


  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 4,
    status: 'done',
    message: `Routed to ${MODEL_DISPLAY_NAMES[selectedModel] || selectedModel}`,
    data: {
      modelSelected: selectedModel,
      modelDisplayName: MODEL_DISPLAY_NAMES[selectedModel] || selectedModel,
      routingReason,
      classification,
      budgetMode,
      degraded,
      webSearchTriggered: !!webSearchResults
    },
    timestamp: new Date().toISOString()
  });

  return {
    classification,
    selectedModel,
    routingReason,
    degraded,
    budgetMode,
    webSearchResults,
    trace: ['toolRouterNode']
  };
}
