import { validateResponse } from '../../services/injection.service.js';
import { recordBlockedCall, recordSpend, getAllBudgetStats } from '../../services/budget.service.js';
import { setCachedResponse } from '../../services/rag.service.js';
import { SecurityLog } from '../../models/SecurityLog.model.js';
import { Session } from '../../models/Session.model.js';
import { emitRoutingEvent } from '../../services/socket.service.js';
import { MODELS } from '../../config/otari.js';

const MODEL_DISPLAY_NAMES = {
  'mzai:moonshotai/Kimi-K2.6': 'Kimi K2.6',
  'anthropic:claude-haiku-4-5': 'Claude Haiku 4.5',
  'anthropic:claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'google:gemini-1.5-flash': 'Gemini 1.5 Flash',
};

/**
 * Node that validates the response for prompt leaks (Layer 3), 
 * logs events, updates budgets, and saves conversation context.
 */
export async function responseNode(state) {
  const { 
    message, 
    answer, 
    sessionId, 
    userId, 
    selectedModel, 
    classification, 
    routingReason, 
    degraded, 
    budgetMode, 
    tokens, 
    cost: rawCost, 
    injectionStatus: initialInjectionStatus,
    retrievedContext
  } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

  // If this was answered from RAG or Cache, skip LLM validations and saves
  if (retrievedContext) {
    return {
      trace: ['responseNode']
    };
  }

  let finalInjectionStatus = initialInjectionStatus || 'clean';

  // 1. Layer 3: System Prompt Leak Validation
  const systemPromptSnippets = ['You are IRIS Bot', 'intelligent AI assistant', 'budget mode'];
  const responseValidation = validateResponse(answer, systemPromptSnippets);
  if (!responseValidation.safe) {
    await recordBlockedCall(sessionId);

    await SecurityLog.create({
      sessionId,
      userId,
      promptSnippet: message.substring(0, 200),
      threatLevel: 'blocked',
      detectionLayer: 'response',
      matchedPatterns: [{ category: 'response_leak', label: 'System Prompt Leak Detected', severity: 0.9 }],
      confidence: 0.9,
      action: 'blocked',
      cost: 0,
    });

    return {
      injectionStatus: 'blocked',
      answer: 'The AI response was intercepted due to a potential security/instruction leak.',
      trace: ['responseNode']
    };
  }

  // 2. Log suspicious events that were monitored but passed
  if (finalInjectionStatus === 'monitor') {
    await SecurityLog.create({
      sessionId,
      userId,
      promptSnippet: message.substring(0, 200),
      threatLevel: 'suspicious',
      detectionLayer: 'local',
      matchedPatterns: [],
      heuristicFlags: ['suspicious_intent'],
      confidence: 0.5,
      action: 'passed',
      cost: rawCost,
    });
  }

  // 3. Record Spend
  const tier = classification ? classification.tier : 'simple';
  const score = classification ? classification.score : 50;
  const reason = routingReason || 'Direct LLM processing';

  await recordSpend(trackingId, selectedModel, rawCost, {
    tier,
    score,
    reason,
  });

  const fullStats = await getAllBudgetStats(trackingId);

  // 4. Calculate actual savings vs worst case (Sonnet)
  const inputToks = tokens?.input || 100;
  const outputToks = tokens?.output || 100;
  const worstCaseRates = { input: 3.00, output: 15.00 };
  const worstCaseCost = (inputToks / 1_000_000 * worstCaseRates.input) + 
                        (outputToks / 1_000_000 * worstCaseRates.output);
  const saved = Math.max(0, worstCaseCost - rawCost);
  const savedPercent = worstCaseCost > 0 ? (saved / worstCaseCost) * 100 : 0;

  const routing = {
    tier,
    score,
    reason,
    model: selectedModel,
    modelDisplayName: MODEL_DISPLAY_NAMES[selectedModel] || selectedModel,
    degraded,
    budgetMode,
    analysisBreakdown: classification?.analysis,
  };

  const cost = {
    thisCall: rawCost,
    thisCallFormatted: `$${rawCost.toFixed(6)}`,
    spent: fullStats.spent,
    remaining: fullStats.remaining,
    percentUsed: fullStats.percentUsed,
    mode: fullStats.mode,
  };

  const costSavings = {
    actualCost: rawCost,
    worstCaseCost,
    saved,
    savedPercent: parseFloat(savedPercent.toFixed(1)),
  };

  // Cache the response
  setCachedResponse(message, {
    answer,
    routing,
    injectionStatus: finalInjectionStatus,
  });

  // Save to Chat Session History in MongoDB
  if (userId && sessionId) {
    await Session.findOneAndUpdate(
      { sessionId, userId },
      {
        $push: {
          messages: [
            { role: 'user', content: message },
            {
              role: 'assistant',
              content: answer,
              routing,
              cost: rawCost,
              costSavings,
              tokens: {
                input: inputToks,
                output: outputToks,
              },
              injectionStatus: finalInjectionStatus,
            }
          ]
        }
      },
      { upsert: true }
    );
  }

  // Emit dynamic results to frontend
  emitRoutingEvent(trackingId, {
    type: 'routing_decision',
    ...routing,
    cost,
    costSavings,
    tokens: {
      input: inputToks,
      output: outputToks,
    },
    timestamp: new Date().toISOString(),
  });

  return {
    routing,
    cost,
    costSavings,
    injectionStatus: finalInjectionStatus,
    trace: ['responseNode']
  };
}
