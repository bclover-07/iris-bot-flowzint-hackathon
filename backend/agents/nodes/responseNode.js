import { validateResponse } from '../../services/injection.service.js';
import { recordBlockedCall, recordSpend, getAllBudgetStats } from '../../services/budget.service.js';
import { setCachedResponse } from '../../services/rag.service.js';
import { SecurityLog } from '../../models/SecurityLog.model.js';
import { Session } from '../../models/Session.model.js';
import { emitRoutingEvent } from '../../services/socket.service.js';
import { MODELS, MODEL_DISPLAY_NAMES } from '../../config/otari.js';

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
  const socketRoomId = sessionId || 'demo-session-id';

  // If this was answered from RAG or Cache, still save to session history for continuity
  if (retrievedContext) {
    if (userId && sessionId) {
      try {
        await Session.findOneAndUpdate(
          { sessionId, userId },
          {
            $push: {
              messages: [
                { role: 'user', content: message },
                {
                  role: 'assistant',
                  content: answer || retrievedContext.answer,
                  routing: retrievedContext.routing,
                  cost: 0,
                  costSavings: { actualCost: 0, worstCaseCost: 0, saved: 0, savedPercent: 0 },
                  tokens: { input: 0, output: 0 },
                  injectionStatus: 'clean',
                }
              ]
            }
          },
          { upsert: true }
        );
      } catch (saveErr) {
        console.error('[responseNode] Failed to save RAG/cache messages:', saveErr.message);
      }
    }
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

    emitRoutingEvent(socketRoomId, {
      type: 'routing_step',
      step: 6,
      status: 'done',
      message: 'Validation: Intercepted (System Prompt Leak Detected)',
      data: { safe: false },
      timestamp: new Date().toISOString()
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
  emitRoutingEvent(socketRoomId, {
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

  emitRoutingEvent(socketRoomId, {
    type: 'routing_step',
    step: 6,
    status: 'done',
    message: 'Validation: Passed (No system prompt leaks)',
    data: { safe: true, costSavings },
    timestamp: new Date().toISOString()
  });

  return {
    routing,
    cost,
    costSavings,
    injectionStatus: finalInjectionStatus,
    trace: ['responseNode']
  };
}
