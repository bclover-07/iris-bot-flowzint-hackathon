import { classifyPrompt } from '../../services/classifier.service.js';
import { getBudgetMode, getDegradedModel, getAllBudgetStats } from '../../services/budget.service.js';
import { MODELS } from '../../config/otari.js';
import { emitRoutingEvent } from '../../services/socket.service.js';
import { searchGrounded } from '../../services/gemini.service.js';

const MODEL_DISPLAY_NAMES = {
  'mzai:moonshotai/Kimi-K2.6': 'Kimi K2.6',
  'anthropic:claude-haiku-4-5': 'Claude Haiku 4.5',
  'anthropic:claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'google:gemini-3.5-flash': 'Gemini 3.5 Flash',
};

async function searchWeb(query) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    const snippetRegex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
    const snippets = [];
    let match;
    while ((match = snippetRegex.exec(text)) !== null && snippets.length < 5) {
      snippets.push(match[1].replace(/<\/?[^>]+(>|$)/g, ""));
    }
    
    if (snippets.length === 0) {
      return '[SYSTEM: A live web search was attempted but no recent results were found. Please answer the user\'s query based on your existing knowledge base.]';
    }
    
    return snippets.join('\n\n');
  } catch (e) {
    return '[SYSTEM: The live web search timed out or failed. Please answer based on your existing knowledge base.]';
  }
}

/**
 * Node that determines model routing tier, applies budget fallback policies,
 * and fetches web search context if triggered by classifier signals or user toggles.
 */
export async function toolRouterNode(state) {
  const { message, sessionId, userId, webSearchMode, sentiment } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

  emitRoutingEvent(trackingId, {
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
    
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 4,
      status: 'routing',
      message: `Browsing live web for current references...`,
      timestamp: new Date().toISOString()
    });
    webSearchResults = await searchGrounded(message);
  }

  emitRoutingEvent(trackingId, {
    type: 'routing_step',
    step: 4,
    status: 'routing',
    message: `Routed to ${MODEL_DISPLAY_NAMES[selectedModel]}. ${routingReason}`,
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
