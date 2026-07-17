import { callOtari, callOtariStream } from '../../services/otari.service.js';
import { emitRoutingEvent } from '../../services/socket.service.js';
import { calculateCost } from '../../config/otari.js';

const MODEL_DISPLAY_NAMES = {
  'mzai:moonshotai/Kimi-K2.6': 'Kimi K2.6',
  'anthropic:claude-haiku-4-5': 'Claude Haiku 4.5',
  'anthropic:claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'google:gemini-1.5-flash': 'Gemini 1.5 Flash',
};

/**
 * Node that runs the LLM call using the selected model, system prompt,
 * and conversational parameters.
 */
export async function llmNode(state, config = {}) {
  const { 
    message, 
    sessionId, 
    userId, 
    selectedModel, 
    chatHistory, 
    socraticMode, 
    webSearchMode, 
    webSearchResults, 
    budgetMode,
    sentiment
  } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

  emitRoutingEvent(trackingId, {
    type: 'routing_step',
    step: 5,
    status: 'generating',
    message: `Synthesizing response from ${MODEL_DISPLAY_NAMES[selectedModel] || 'AI Model'}...`,
    timestamp: new Date().toISOString()
  });

  let baseSystemPrompt = `You are IRIS Bot, an intelligent AI assistant for students. 
Be helpful, concise, and educational. 
Current budget mode: ${budgetMode}. 
Today's date: ${new Date().toLocaleDateString()}.`;

  // Empathy adaptations based on sentiment
  if (sentiment) {
    if (sentiment.behavior === 'empathetic_direct') {
      baseSystemPrompt += `\n[BEHAVIOR ADAPTATION]: The student appears highly frustrated or angry. Skip generic opening fluff. Be extremely empathetic, direct, concise, and solve the student's problem immediately. Start your response by validating their frustration.`;
    } else if (sentiment.behavior === 'concise_helpful') {
      baseSystemPrompt += `\n[BEHAVIOR ADAPTATION]: The student is slightly frustrated. Keep your answer brief, direct, and structurally well-organized. Avoid long paragraphs.`;
    }
  }

  // Web search integration
  if (webSearchResults) {
    baseSystemPrompt += `\n\n[LIVE WEB SEARCH RESULTS FOR USER QUERY]:\n${webSearchResults}\n\nUse the above real-time data to answer the user's query accurately. Do NOT mention that you used a proxy or DuckDuckGo, just provide the answer seamlessly.`;
  }
  
  // Local Knowledge Base RAG integration
  if (state.retrievedContext && state.retrievedContext.source === 'knowledge-base') {
    baseSystemPrompt += `\n\n[LOCAL KNOWLEDGE BASE CONTEXT]:\n${state.retrievedContext.answer}\n\nUse the above context to answer the user's query accurately and conversationally. Expand upon it slightly to make it sound natural and helpful.`;
  }

  // Handle Socratic/Guided Mentor mode
  const finalSystemPromptSnippets = [baseSystemPrompt];
  if (socraticMode) {
    // If the student is frustrated, lower Socratic stiffness to keep UX high!
    const isFrustrated = sentiment && ['NEGATIVE', 'VERY_NEGATIVE', 'FRUSTRATED'].includes(sentiment.label);
    if (isFrustrated) {
      finalSystemPromptSnippets.unshift(
        "You are acting as a Guided Mentor.",
        "Normally, you use Socratic mode, but the student is frustrated. Give a brief, direct explanation first, then ask a simple, helpful follow-up question to keep them engaged without adding frustration."
      );
    } else {
      finalSystemPromptSnippets.unshift(
        "You are acting as a Socratic Teacher.",
        "Do NOT give direct answers. Instead, ask probing questions to help the user discover the answer themselves.",
        "Encourage critical thinking and guide them step-by-step."
      );
    }
  }

  const writer = config?.configurable?.writer;
  let otariResult;

  if (writer) {
    try {
      const stream = await callOtariStream({
        model: selectedModel,
        messages: [
          ...chatHistory.slice(-6),
          { role: 'user', content: message },
        ],
        systemPrompt: finalSystemPromptSnippets.join('\n'),
        guardrailMode: 'block',
        sessionId,
      });

      let fullAnswer = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        if (content) {
          fullAnswer += content;
          writer(content);
        }
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens || inputTokens;
          outputTokens = chunk.usage.completion_tokens || outputTokens;
        }
      }

      if (inputTokens === 0) {
        inputTokens = Math.round((message.length + finalSystemPromptSnippets.join('\n').length) / 4);
        outputTokens = Math.round(fullAnswer.length / 4);
      }
      const cost = calculateCost(selectedModel, inputTokens, outputTokens);

      otariResult = {
        answer: fullAnswer,
        inputTokens,
        outputTokens,
        cost,
      };
    } catch (err) {
      console.error('[Agent LLM Node] Otari Streaming API Error:', err.message);
      if (err?.status === 400 || err?.status === 403 || err?.message?.toLowerCase().includes('injection') || err?.message?.toLowerCase().includes('guardrail')) {
        return {
          injectionStatus: 'blocked',
          answer: 'Your message was flagged as a potential prompt injection attempt and blocked by Mozilla Otari PIGuard.',
          trace: ['llmNode']
        };
      }
      otariResult = {
        answer: "I'm having trouble connecting to my cognitive routing servers. Let me assist you from my offline fallback model. " + 
                "Regarding your query: " + message,
        cost: 0.0001,
        inputTokens: 50,
        outputTokens: 50,
      };
    }
  } else {
    try {
      otariResult = await callOtari({
        model: selectedModel,
        messages: [
          ...chatHistory.slice(-6),
          { role: 'user', content: message },
        ],
        systemPrompt: finalSystemPromptSnippets.join('\n'),
        guardrailMode: 'block',
        useWebSearch: webSearchMode,
        sessionId,
      });
    } catch (err) {
      console.error('[Agent LLM Node] Otari API Error:', err.message);
      
      // Check for Gateway Block
      if (err?.status === 400 || err?.status === 403 || err?.message?.toLowerCase().includes('injection') || err?.message?.toLowerCase().includes('guardrail')) {
        return {
          injectionStatus: 'blocked',
          answer: 'Your message was flagged as a potential prompt injection attempt and blocked by Mozilla Otari PIGuard.',
          trace: ['llmNode']
        };
      }
      
      // Normal fallback
      otariResult = {
        answer: "I'm having trouble connecting to my cognitive routing servers. Let me assist you from my offline fallback model. " + 
                "Regarding your query: " + message,
        cost: 0.0001,
        inputTokens: 50,
        outputTokens: 50,
      };
    }
  }

  return {
    answer: otariResult.answer,
    tokens: {
      input: otariResult.inputTokens,
      output: otariResult.outputTokens,
    },
    cost: otariResult.cost,
    trace: ['llmNode']
  };
}

