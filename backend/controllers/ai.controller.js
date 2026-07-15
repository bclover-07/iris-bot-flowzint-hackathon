import { graph } from '../agents/graph.js';
import { getAllBudgetStats } from '../services/budget.service.js';
import { emitRoutingEvent } from '../services/socket.service.js';
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

    // Run the compiled LangGraph workflow state machine
    const finalState = await graph.invoke({
      message,
      sessionId,
      userId,
      chatHistory,
      socraticMode,
      webSearchMode,
    });

    const latencyMs = Date.now() - startTime;

    // Check if input was blocked by prompt injection firewall
    if (finalState.injectionStatus === 'blocked') {
      return res.status(400).json({
        error: 'prompt_injection_detected',
        message: finalState.answer || 'Your message was flagged as a potential prompt injection attempt and blocked.',
        injectionStatus: 'blocked',
        cost: { thisCall: 0, spent: 0, remaining: 2.0, percentUsed: 0, mode: 'normal' },
      });
    }

    // Check if budget was exceeded
    if (finalState.budgetMode === 'exceeded') {
      const budgetStats = await getAllBudgetStats(trackingId);
      return res.status(429).json({
        error: 'budget_exceeded',
        message: `Daily AI budget of $${budgetStats.total.toFixed(2)} has been reached. Please try again in a new session.`,
        budgetStats,
      });
    }

    // Construct response payload exactly as expected by the frontend
    const responsePayload = {
      answer: finalState.answer,
      source: finalState.retrievedContext ? (finalState.retrievedContext.source || 'knowledge-base') : 'otari',
      routing: finalState.routing || (finalState.retrievedContext ? finalState.retrievedContext.routing : null),
      cost: finalState.cost || (finalState.retrievedContext ? finalState.retrievedContext.cost : null),
      costSavings: finalState.costSavings || { actualCost: 0, worstCaseCost: 0, saved: 0, savedPercent: 0 },
      tokens: finalState.tokens || { input: 0, output: 0 },
      injectionStatus: finalState.injectionStatus || 'clean',
      sentiment: finalState.sentiment,
    };

    // Emit final step via WebSocket
    emitRoutingEvent(trackingId, {
      type: 'routing_step',
      step: 6,
      status: 'done',
      message: `Agent graph completed execution in ${latencyMs}ms.`,
      timestamp: new Date().toISOString()
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

    // For stream, invoke graph to get full state, then simulate streaming responses back to keep frontend compatibility
    const finalState = await graph.invoke({
      message,
      sessionId,
      userId,
      chatHistory,
      socraticMode,
      webSearchMode,
    });

    if (finalState.injectionStatus === 'blocked') {
      res.write(`data: ${JSON.stringify({ error: 'prompt_injection_detected', message: finalState.answer || 'Blocked.', injectionStatus: 'blocked' })}\n\n`);
      return res.end();
    }

    if (finalState.budgetMode === 'exceeded') {
      const stats = await getAllBudgetStats(trackingId);
      res.write(`data: ${JSON.stringify({ error: 'budget_exceeded', message: 'Budget exceeded.', budgetStats: stats })}\n\n`);
      return res.end();
    }

    const answer = finalState.answer || '';
    const words = answer.split(' ');
    
    // Stream output words to simulate streaming chunks
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i === words.length - 1 ? '' : ' ');
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      await new Promise(r => setTimeout(r, 20)); // simulated streaming chunk intervals
    }

    const responsePayload = {
      answer: finalState.answer,
      source: finalState.retrievedContext ? (finalState.retrievedContext.source || 'knowledge-base') : 'otari',
      routing: finalState.routing || (finalState.retrievedContext ? finalState.retrievedContext.routing : null),
      cost: finalState.cost || (finalState.retrievedContext ? finalState.retrievedContext.cost : null),
      costSavings: finalState.costSavings || { actualCost: 0, worstCaseCost: 0, saved: 0, savedPercent: 0 },
      tokens: finalState.tokens || { input: 0, output: 0 },
      injectionStatus: finalState.injectionStatus || 'clean',
      sentiment: finalState.sentiment,
    };

    res.write(`data: ${JSON.stringify({ done: true, ...responsePayload })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: 'server_error', message: err.message })}\n\n`);
    res.end();
  }
}
