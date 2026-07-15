import { classifyPrompt } from '../services/classifier.service.js';
import {
  getBudgetMode, 
  getDegradedModel, 
  recordBlockedCall, 
  getAllBudgetStats,
  getBudgetState,
  recordSpend
} from '../services/budget.service.js';
import { searchKnowledgeBase, getCachedResponse, setCachedResponse } from '../services/rag.service.js';
import { callOtari, callOtariStream } from '../services/otari.service.js';
import { emitRoutingEvent } from '../services/socket.service.js';
import { MODELS } from '../config/otari.js';
import { detectInjection, validateResponse } from '../services/injection.service.js';
import { SecurityLog } from '../models/SecurityLog.model.js';
import { Session } from '../models/Session.model.js';


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

const MODEL_DISPLAY_NAMES = {
  'mzai:moonshotai/Kimi-K2.6': 'Kimi K2.6',
  'anthropic:claude-haiku-4-5': 'Claude Haiku 4.5',
  'anthropic:claude-sonnet-4-6': 'Claude Sonnet 4.6',
};

export async function handleAIChat(req, res, next) {
  try {
    const { message, sessionId, chatHistory = [], socraticMode = false, webSearchMode = false } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const startTime = Date.now();
    const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');
    
    // Moving Train Step 1: Query Received
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 1,
      status: 'analyzing',
      message: 'Query Received. Analyzing intent...',
      timestamp: new Date().toISOString()
    });

    const budgetStatsBefore = await getAllBudgetStats(trackingId);

    // 1. Zero-Cost Semantic Caching / RAG
    const ragResult = searchKnowledgeBase(message);
    if (ragResult && ragResult.score > 0.5) {
      const responsePayload = {
        answer: ragResult.answer,
        source: 'knowledge-base',
        routing: {
          model: 'Local KB',
          tier: 'cached',
          reason: `Answered from local knowledge base (Score: ${Math.round(ragResult.score * 100)}%)`,
          score: Math.round(ragResult.score * 100),
          modelDisplayName: 'Local KB',
          degraded: false,
          budgetMode: budgetStatsBefore.mode,
        },
        cost: {
          thisCall: 0,
          thisCallFormatted: '$0.000000',
          spent: budgetStatsBefore.spent,
          remaining: budgetStatsBefore.remaining,
          percentUsed: budgetStatsBefore.percentUsed,
          mode: budgetStatsBefore.mode,
        },
        costSavings: {
          actualCost: 0,
          worstCaseCost: 0.006,
          saved: 0.006,
          savedPercent: 100,
        },
        injectionStatus: 'clean',
      };

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
                  content: ragResult.answer,
                  routing: responsePayload.routing,
                  cost: 0,
                  injectionStatus: 'clean',
                }
              ]
            }
          },
          { upsert: true }
        );
      }

      emitRoutingEvent(trackingId, {
        type: 'routing_decision',
        ...responsePayload.routing,
        cost: responsePayload.cost,
        timestamp: new Date().toISOString(),
      });

      return res.json(responsePayload);
    }

    // 2. Query Cache
    const cachedResponse = getCachedResponse(message);
    if (cachedResponse) {
      const responsePayload = {
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
      };

      emitRoutingEvent(trackingId, {
        type: 'routing_decision',
        ...responsePayload.routing,
        cost: responsePayload.cost,
        timestamp: new Date().toISOString(),
      });

      return res.json(responsePayload);
    }

    // Moving Train Step 2: Context Window & Security Check
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 2,
      status: 'analyzing',
      message: `Estimating Context Window: ~${Math.round(message.length / 4)} tokens. Running PIGuard...`,
      timestamp: new Date().toISOString()
    });

    // 3. Local Injection Detection (Layer 1)
    const localInjectionResult = detectInjection(message);
    if (localInjectionResult.isInjection) {
      await recordBlockedCall(trackingId);
      
      await SecurityLog.create({
        sessionId,
        userId,
        promptSnippet: message.substring(0, 200),
        threatLevel: 'blocked',
        detectionLayer: 'local',
        matchedPatterns: localInjectionResult.matchedPatterns,
        heuristicFlags: localInjectionResult.heuristicFlags,
        confidence: localInjectionResult.confidence,
        action: 'blocked',
        cost: 0,
      });

      emitRoutingEvent(trackingId, {
        type: 'injection_blocked',
        message: message.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        error: 'prompt_injection_detected',
        message: 'Your message was flagged as a potential prompt injection attempt and blocked by the local security guardrail.',
        injectionStatus: 'blocked',
        cost: { thisCall: 0, ...budgetStatsBefore },
      });
    }

    // Moving Train Step 3: Routing Logic
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 3,
      status: 'routing',
      message: `Security passed. Evaluating query complexity for optimal routing...`,
      timestamp: new Date().toISOString()
    });

    // 4. Dynamic Prompt Classification
    const classification = classifyPrompt(message);
    const baseModel = MODELS[classification.tier.toUpperCase()];

    // 5. Budget Status & Graceful Degradation
    const budgetMode = await getBudgetMode(trackingId);
    if (budgetMode === 'exceeded') {
      return res.status(429).json({
        error: 'budget_exceeded',
        message: `Daily AI budget of $${budgetStatsBefore.total.toFixed(2)} has been reached. Please try again in a new session.`,
        budgetStats: budgetStatsBefore,
      });
    }

    let selectedModel = await getDegradedModel(trackingId, baseModel);
    const degraded = selectedModel !== baseModel;
    
    let degradeReason;
    if (degraded) {
      degradeReason = `[BUDGET FALLBACK] ⚠️ ${budgetMode.toUpperCase()} mode! Downgraded from ${MODEL_DISPLAY_NAMES[baseModel]} to Budget ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`;
    } else {
      const tierName = classification.tier === 'simple' ? 'Budget' : 'Premium';
      degradeReason = `[BUDGET HEALTHY] ✅ Sufficient funds ($${budgetStatsBefore.remaining.toFixed(2)} left). Safely routed to ${tierName} ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`;
    }

    // --- OVERRIDE FOR EXPLICIT WEB SEARCH ---
    if (webSearchMode) {
      selectedModel = MODELS.SIMPLE; // Force Mozilla Otari AI
      classification.signals.needsWebSearch = true;
      degradeReason = `[WEB SEARCH ENABLED] 🌐 Forced routing to Mozilla Otari AI (${MODEL_DISPLAY_NAMES[selectedModel]}).`;
    }

    let injectionStatus = localInjectionResult.threatLevel === 'suspicious' ? 'monitor' : 'clean';
    let otariResult;

    // Moving Train Step 4: Model Selected
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 4,
      status: 'routing',
      message: `Routed to ${MODEL_DISPLAY_NAMES[selectedModel]}. ${degradeReason}`,
      timestamp: new Date().toISOString()
    });

    let webSearchResults = '';
    if (classification.signals.needsWebSearch) {
      emitRoutingEvent(trackingId, {
        type: 'routing_step',
        step: 4,
        status: 'routing',
        message: `Browsing the live web for: "${message.substring(0, 30)}..."`,
        timestamp: new Date().toISOString()
      });
      webSearchResults = await searchWeb(message);
    }

    let baseSystemPrompt = socraticMode 
      ? `You are IRIS, an intelligent AI Socratic Tutor for students. 
         Your core directives:
         1. NEVER just give the final answer to a homework, math, or coding problem. Instead, ask guiding questions and guide the student to figure it out themselves.
         2. Protect privacy: Never ask for or reveal Personal Identifiable Information (PII).
         3. Be helpful, concise, and educational.
         Current budget mode: ${budgetMode}. 
         Today's date: ${new Date().toLocaleDateString()}.`
      : `You are IRIS, an intelligent AI assistant for students. 
         Be helpful, concise, and educational. 
         Current budget mode: ${budgetMode}. 
         Today's date: ${new Date().toLocaleDateString()}.`;

    if (classification.signals.needsWebSearch && webSearchResults) {
      baseSystemPrompt += `\n\n[LIVE WEB SEARCH RESULTS FOR USER QUERY]:\n${webSearchResults}\n\nUse the above real-time data to answer the user's query accurately. Do NOT mention that you used a proxy or DuckDuckGo, just provide the answer seamlessly.`;
    }

    // Apply Socratic Mode if enabled
    let finalSystemPromptSnippets = [baseSystemPrompt];
    if (socraticMode) {
      finalSystemPromptSnippets.unshift(
        "You are now acting as a 'Socratic Teacher' (or Guided Mentor).",
        "Do NOT give direct answers. Instead, ask probing questions to help the user discover the answer themselves.",
        "Encourage critical thinking and guide them step-by-step."
      );
    }

    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 5,
      status: 'generating',
      message: `Streaming response from ${MODEL_DISPLAY_NAMES[selectedModel]}...`,
      timestamp: new Date().toISOString()
    });

    // 6. Otari API Call with edge guardrail (Layer 2)
    try {
      otariResult = await callOtari({
        model: selectedModel,
        messages: [
          ...chatHistory.slice(-6),
          { role: 'user', content: message },
        ],
        systemPrompt: finalSystemPromptSnippets.join('\n'),
        guardrailMode: 'block', // Enforce blocking at the gateway
        useWebSearch: webSearchMode, // Send to Otari if enabled by user
        sessionId,
      });
    } catch (err) {
      // Differentiate between Web Search 403 and actual prompt injection
      if (err?.status === 403 && webSearchMode) {
        return res.json({
          answer: "⚠️ **Web Search Failed**: Your current Otari API key does not have permission to use the Web Search tool. Please upgrade your key or disable the Web Search toggle.",
          cost: { thisCall: 0, ...await getAllBudgetStats(sessionId) },
        });
      }

      // If Otari blocks the request due to injection
      if (err?.status === 400 || err?.status === 403 || err?.message?.toLowerCase().includes('injection') || err?.message?.toLowerCase().includes('guardrail')) {
        injectionStatus = 'blocked';
        await recordBlockedCall(sessionId);

        await SecurityLog.create({
          sessionId,
          userId,
          promptSnippet: message.substring(0, 200),
          threatLevel: 'blocked',
          detectionLayer: 'piguard',
          matchedPatterns: [{ category: 'gateway_block', label: 'Otari PIGuard Gateway Block', severity: 1.0 }],
          confidence: 1.0,
          action: 'blocked',
          cost: 0,
        });

        emitRoutingEvent(trackingId, {
          type: 'injection_blocked',
          message: message.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
        });

        return res.status(400).json({
          error: 'prompt_injection_detected',
          message: 'Your message was flagged as a potential prompt injection attempt and blocked by Mozilla Otari PIGuard.',
          injectionStatus: 'blocked',
          cost: { thisCall: 0, ...await getAllBudgetStats(sessionId) },
        });
      }
      
      // Pass other errors up
      throw err;
    }

    // 7. Response Validation (Layer 3)
    const systemPromptSnippets = ['You are IRIS', 'intelligent AI assistant', 'budget mode'];
    const responseValidation = validateResponse(otariResult.answer, systemPromptSnippets);
    if (!responseValidation.safe) {
      injectionStatus = 'blocked';
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

      return res.status(400).json({
        error: 'prompt_injection_detected',
        message: 'The AI response was intercepted due to a potential security/instruction leak.',
        injectionStatus: 'blocked',
        cost: { thisCall: 0, ...await getAllBudgetStats(sessionId) },
      });
    }

    // 8. Log suspicious events that were monitored but passed
    if (injectionStatus === 'monitor') {
      await SecurityLog.create({
        sessionId,
        userId,
        promptSnippet: message.substring(0, 200),
        threatLevel: 'suspicious',
        detectionLayer: 'local',
        matchedPatterns: localInjectionResult.matchedPatterns,
        heuristicFlags: localInjectionResult.heuristicFlags,
        confidence: localInjectionResult.confidence,
        action: 'passed',
        cost: otariResult.cost,
      });
    }

    // 9. Update Budget State
    const budgetState = await recordSpend(trackingId, selectedModel, otariResult.cost, {
      tier: classification.tier,
      score: classification.score,
      reason: degradeReason || classification.reason,
    });
    const fullStats = await getAllBudgetStats(trackingId);

    // 10. Calculate actual savings vs worst case (Sonnet)
    const worstCaseModel = MODELS.COMPLEX;
    const worstCaseRates = { input: 3.00, output: 15.00 };
    const worstCaseCost = (otariResult.inputTokens / 1_000_000 * worstCaseRates.input) + 
                          (otariResult.outputTokens / 1_000_000 * worstCaseRates.output);
    const saved = Math.max(0, worstCaseCost - otariResult.cost);
    const savedPercent = worstCaseCost > 0 ? (saved / worstCaseCost) * 100 : 0;

    const responsePayload = {
      answer: otariResult.answer,
      source: 'otari',
      routing: {
        tier: classification.tier,
        score: classification.score,
        reason: degradeReason || classification.reason,
        model: selectedModel,
        modelDisplayName: MODEL_DISPLAY_NAMES[selectedModel],
        degraded,
        budgetMode,
        analysisBreakdown: classification.analysis,
      },
      cost: {
        thisCall: otariResult.cost,
        thisCallFormatted: `$${otariResult.cost.toFixed(6)}`,
        spent: fullStats.spent,
        remaining: fullStats.remaining,
        percentUsed: fullStats.percentUsed,
        mode: fullStats.mode,
      },
      costSavings: {
        actualCost: otariResult.cost,
        worstCaseCost,
        saved,
        savedPercent: parseFloat(savedPercent.toFixed(1)),
      },
      tokens: {
        input: otariResult.inputTokens,
        output: otariResult.outputTokens,
      },
      injectionStatus,
    };

    // Cache the response
    setCachedResponse(message, {
      answer: otariResult.answer,
      routing: responsePayload.routing,
      injectionStatus,
    });

    const latencyMs = Date.now() - startTime;

    // Save to Chat Session History in MongoDB
    if (userId && sessionId) {
      // Find session or create one, add message
      await Session.findOneAndUpdate(
        { sessionId, userId },
        {
          $push: {
            messages: [
              { role: 'user', content: message },
              {
                role: 'assistant',
                content: otariResult.answer,
                routing: responsePayload.routing,
                cost: otariResult.cost,
                costSavings: responsePayload.costSavings,
                tokens: responsePayload.tokens,
                latencyMs,
                injectionStatus,
              }
            ]
          }
        },
        { upsert: true }
      );
    }

    // Moving Train Step 6: Done
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 6,
      status: 'done',
      message: `Response generated in ${latencyMs}ms.`,
      timestamp: new Date().toISOString()
    });

    emitRoutingEvent(trackingId, {
      type: 'routing_decision',
      ...responsePayload.routing,
      cost: responsePayload.cost,
      costSavings: responsePayload.costSavings,
      tokens: responsePayload.tokens,
      timestamp: new Date().toISOString(),
    });

    return res.json(responsePayload);

  } catch (err) {
    next(err);
  }
}

export async function getChatHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id || req.user?.id;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'Missing userId or sessionId' });
    }

    const session = await Session.findOne({ sessionId, userId });
    
    if (!session) {
      return res.json({ messages: [] });
    }

    const formattedMessages = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg._id,
      tier: msg.routing?.tier,
      model: msg.routing?.model,
      routing: msg.routing,
      cost: msg.cost,
      injectionStatus: msg.injectionStatus
    }));

    return res.json({ messages: formattedMessages });
  } catch (err) {
    console.error('Failed to get chat history:', err);
    next(err);
  }
}

export async function handleAIChatStream(req, res, next) {
  try {
    const { message, sessionId, chatHistory = [], socraticMode = false, webSearchMode = false } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const startTime = Date.now();
    const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 1,
      status: 'analyzing',
      message: 'Query Received. Analyzing intent...',
      timestamp: new Date().toISOString()
    });

    const budgetStatsBefore = await getAllBudgetStats(trackingId);

    // 1. Zero-Cost Semantic Caching / RAG
    const ragResult = searchKnowledgeBase(message);
    if (ragResult && ragResult.score > 0.5) {
      const responsePayload = {
        answer: ragResult.answer,
        source: 'knowledge-base',
        routing: {
          model: 'Local KB',
          tier: 'cached',
          reason: `Answered from local knowledge base (Score: ${Math.round(ragResult.score * 100)}%)`,
          score: Math.round(ragResult.score * 100),
          modelDisplayName: 'Local KB',
          degraded: false,
          budgetMode: budgetStatsBefore.mode,
        },
        cost: {
          thisCall: 0,
          thisCallFormatted: '$0.000000',
          spent: budgetStatsBefore.spent,
          remaining: budgetStatsBefore.remaining,
          percentUsed: budgetStatsBefore.percentUsed,
          mode: budgetStatsBefore.mode,
        },
        costSavings: {
          actualCost: 0,
          worstCaseCost: 0.006,
          saved: 0.006,
          savedPercent: 100,
        },
        injectionStatus: 'clean',
      };

      if (userId && sessionId) {
        await Session.findOneAndUpdate(
          { sessionId, userId },
          {
            $push: {
              messages: [
                { role: 'user', content: message },
                {
                  role: 'assistant',
                  content: ragResult.answer,
                  routing: responsePayload.routing,
                  cost: 0,
                  injectionStatus: 'clean',
                }
              ]
            }
          },
          { upsert: true }
        );
      }

      emitRoutingEvent(trackingId, {
        type: 'routing_decision',
        ...responsePayload.routing,
        cost: responsePayload.cost,
        timestamp: new Date().toISOString(),
      });

      res.write(`data: ${JSON.stringify({ chunk: ragResult.answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, ...responsePayload })}\n\n`);
      return res.end();
    }

    // 2. Query Cache
    const cachedResponse = getCachedResponse(message);
    if (cachedResponse) {
      const responsePayload = {
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
      };

      emitRoutingEvent(trackingId, {
        type: 'routing_decision',
        ...responsePayload.routing,
        cost: responsePayload.cost,
        timestamp: new Date().toISOString(),
      });

      res.write(`data: ${JSON.stringify({ chunk: cachedResponse.answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, ...responsePayload })}\n\n`);
      return res.end();
    }

    // 3. Local Injection Detection
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 2,
      status: 'analyzing',
      message: `Estimating Context Window: ~${Math.round(message.length / 4)} tokens. Running PIGuard...`,
      timestamp: new Date().toISOString()
    });

    const localInjectionResult = detectInjection(message);
    if (localInjectionResult.isInjection) {
      await recordBlockedCall(trackingId);
      
      await SecurityLog.create({
        sessionId,
        userId,
        promptSnippet: message.substring(0, 200),
        threatLevel: 'blocked',
        detectionLayer: 'local',
        matchedPatterns: localInjectionResult.matchedPatterns,
        heuristicFlags: localInjectionResult.heuristicFlags,
        confidence: localInjectionResult.confidence,
        action: 'blocked',
        cost: 0,
      });

      emitRoutingEvent(trackingId, {
        type: 'injection_blocked',
        message: message.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
      });

      res.write(`data: ${JSON.stringify({ error: 'prompt_injection_detected', message: 'Blocked by local security guardrail.', injectionStatus: 'blocked' })}\n\n`);
      return res.end();
    }

    // 4. Dynamic Prompt Classification
    const classification = classifyPrompt(message);
    const baseModel = MODELS[classification.tier.toUpperCase()];

    // 5. Budget Status & Graceful Degradation
    const budgetMode = await getBudgetMode(trackingId);
    if (budgetMode === 'exceeded') {
      res.write(`data: ${JSON.stringify({ error: 'budget_exceeded', message: 'Budget exceeded.', budgetStats: budgetStatsBefore })}\n\n`);
      return res.end();
    }

    let selectedModel = await getDegradedModel(trackingId, baseModel);
    const degraded = selectedModel !== baseModel;
    let degradeReason = degraded
      ? `[BUDGET FALLBACK] ⚠️ ${budgetMode.toUpperCase()} mode! Downgraded from ${MODEL_DISPLAY_NAMES[baseModel]} to Budget ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`
      : `[BUDGET HEALTHY] ✅ Sufficient funds left. Safely routed to ${MODEL_DISPLAY_NAMES[selectedModel]}. Intent: ${classification.reason}`;

    if (webSearchMode) {
      selectedModel = MODELS.SIMPLE;
      classification.signals.needsWebSearch = true;
      degradeReason = `[WEB SEARCH ENABLED] 🌐 Forced routing to Mozilla Otari AI (${MODEL_DISPLAY_NAMES[selectedModel]}).`;
    }

    let injectionStatus = localInjectionResult.threatLevel === 'suspicious' ? 'monitor' : 'clean';

    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 4,
      status: 'routing',
      message: `Routed to ${MODEL_DISPLAY_NAMES[selectedModel]}. ${degradeReason}`,
      timestamp: new Date().toISOString()
    });

    let webSearchResults = '';
    if (classification.signals.needsWebSearch) {
      emitRoutingEvent(trackingId, {
        type: 'routing_step',
        step: 4,
        status: 'routing',
        message: `Browsing the live web for: "${message.substring(0, 30)}..."`,
        timestamp: new Date().toISOString()
      });
      webSearchResults = await searchWeb(message);
    }

    let baseSystemPrompt = socraticMode 
      ? `You are IRIS, an intelligent AI Socratic Tutor for students. 
         NEVER just give the final answer. Ask guiding questions.
         Current budget mode: ${budgetMode}. Today: ${new Date().toLocaleDateString()}.`
      : `You are IRIS, an intelligent AI assistant for students. 
         Be helpful, concise, and educational. 
         Current budget mode: ${budgetMode}. Today: ${new Date().toLocaleDateString()}.`;

    if (classification.signals.needsWebSearch && webSearchResults) {
      baseSystemPrompt += `\n\n[LIVE WEB SEARCH RESULTS]:\n${webSearchResults}\n\nUse this data to answer accurately.`;
    }

    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 5,
      status: 'generating',
      message: `Streaming response from ${MODEL_DISPLAY_NAMES[selectedModel]}...`,
      timestamp: new Date().toISOString()
    });

    // 6. Otari API Stream
    let stream;
    try {
      stream = await callOtariStream({
        model: selectedModel,
        messages: [...chatHistory.slice(-6), { role: 'user', content: message }],
        systemPrompt: baseSystemPrompt,
        guardrailMode: 'block',
        sessionId,
      });
    } catch (err) {
      if (err?.status === 403 && webSearchMode) {
        res.write(`data: ${JSON.stringify({ chunk: "⚠️ **Web Search Failed**: API key permission issue." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true, answer: "⚠️ **Web Search Failed**: API key permission issue.", cost: { thisCall: 0, ...await getAllBudgetStats(sessionId) } })}\n\n`);
        return res.end();
      }
      if (err?.status === 400 || err?.status === 403 || err?.message?.toLowerCase().includes('injection')) {
        await recordBlockedCall(sessionId);
        res.write(`data: ${JSON.stringify({ error: 'prompt_injection_detected', message: 'Blocked by Otari PIGuard.', injectionStatus: 'blocked' })}\n\n`);
        return res.end();
      }
      res.write(`data: ${JSON.stringify({ error: 'server_error', message: 'An error occurred with the AI stream.' })}\n\n`);
      return res.end();
    }

    let fullAnswer = '';
    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content || '';
      if (text) {
        fullAnswer += text;
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      }
    }

    // 7. Response Validation (Layer 3)
    const systemPromptSnippets = ['You are IRIS', 'intelligent AI assistant', 'budget mode'];
    const responseValidation = validateResponse(fullAnswer, systemPromptSnippets);
    if (!responseValidation.safe) {
      injectionStatus = 'blocked';
      await recordBlockedCall(sessionId);
      res.write(`data: ${JSON.stringify({ error: 'prompt_injection_detected', message: 'Response blocked due to security leak.', injectionStatus: 'blocked' })}\n\n`);
      return res.end();
    }

    if (injectionStatus === 'monitor') {
      await SecurityLog.create({
        sessionId, userId, promptSnippet: message.substring(0, 200), threatLevel: 'suspicious', detectionLayer: 'local',
        matchedPatterns: localInjectionResult.matchedPatterns, confidence: localInjectionResult.confidence, action: 'passed', cost: 0,
      });
    }

    // Cost estimation for stream (Otari might not give usage in stream)
    const estimatedInput = Math.round(message.length / 4) + 100;
    const estimatedOutput = Math.round(fullAnswer.length / 4);
    const rates = {
      'mzai:moonshotai/Kimi-K2.6': { input: 0.15, output: 0.60 },
      'anthropic:claude-haiku-4-5': { input: 0.25, output: 1.25 },
      'anthropic:claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    };
    const modelRates = rates[selectedModel] || rates['mzai:moonshotai/Kimi-K2.6'];
    const calculatedCost = (estimatedInput / 1_000_000 * modelRates.input) + (estimatedOutput / 1_000_000 * modelRates.output);

    await recordSpend(trackingId, selectedModel, calculatedCost, {
      tier: classification.tier,
      score: classification.score,
      reason: degradeReason || classification.reason,
    });
    const fullStats = await getAllBudgetStats(trackingId);

    const worstCaseCost = (estimatedInput / 1_000_000 * 3.00) + (estimatedOutput / 1_000_000 * 15.00);
    const saved = Math.max(0, worstCaseCost - calculatedCost);
    
    const responsePayload = {
      answer: fullAnswer,
      routing: {
        tier: classification.tier,
        score: classification.score,
        reason: degradeReason || classification.reason,
        model: selectedModel,
        modelDisplayName: MODEL_DISPLAY_NAMES[selectedModel],
        degraded,
        budgetMode,
        analysisBreakdown: classification.analysis,
      },
      cost: {
        thisCall: calculatedCost,
        thisCallFormatted: `$${calculatedCost.toFixed(6)}`,
        spent: fullStats.spent,
        remaining: fullStats.remaining,
        percentUsed: fullStats.percentUsed,
        mode: fullStats.mode,
      },
      costSavings: {
        actualCost: calculatedCost,
        worstCaseCost,
        saved,
        savedPercent: parseFloat((worstCaseCost > 0 ? (saved / worstCaseCost) * 100 : 0).toFixed(1)),
      },
      injectionStatus,
    };

    setCachedResponse(message, { answer: fullAnswer, routing: responsePayload.routing, injectionStatus });

    if (userId && sessionId) {
      await Session.findOneAndUpdate(
        { sessionId, userId },
        { $push: { messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: fullAnswer, routing: responsePayload.routing, cost: calculatedCost, costSavings: responsePayload.costSavings, injectionStatus }
        ]}},
        { upsert: true }
      );
    }

    emitRoutingEvent(trackingId, { type: 'routing_decision', ...responsePayload.routing, cost: responsePayload.cost, costSavings: responsePayload.costSavings, timestamp: new Date().toISOString() });

    res.write(`data: ${JSON.stringify({ done: true, ...responsePayload })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: 'server_error', message: err.message })}\n\n`);
    res.end();
  }
}

