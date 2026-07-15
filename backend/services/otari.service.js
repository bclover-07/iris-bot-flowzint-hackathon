import { otariClient, calculateCost } from '../config/otari.js';

export async function callOtari({
  model,
  messages,
  systemPrompt,
  guardrailMode = 'block',
  useWebSearch = false,
  sessionId,
}) {
  const formattedMessages = [];
  
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  
  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  const requestBody = {
    model: model,
    messages: formattedMessages,
    extra_body: {
      client_name: sessionId || 'default-session',
      guardrails: [
        { profile: 'prompt-injection', mode: guardrailMode }
      ]
    }
  };


  let response;
  try {
    if (process.env.OTARI_API_KEY === 'mock-key') {
      response = {
        usage: { prompt_tokens: Math.floor(Math.random() * 50) + 10, completion_tokens: Math.floor(Math.random() * 50) + 20 },
        choices: [{ message: { content: "This is a mock response from IRIS Bot! Since you're using a mock API key, I'm just playing along." } }],
        headers: new Headers()
      };
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
    } else {
      try {
        response = await otariClient.chat.completions.create(requestBody);
      } catch (err) {
        if (err.status === 502) {
          console.warn(`[Otari API] 502 Bad Gateway on ${model}. Retrying in 1.5s...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          response = await otariClient.chat.completions.create(requestBody);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    // Fallback logic: If the selected model (e.g., Claude) is not available (404/502),
    // we gracefully fall back to Kimi K2.6 so the application never crashes.
    if (model !== 'mzai:moonshotai/Kimi-K2.6' && (err.status === 404 || err.status === 502 || err.message?.includes('not found') || err.message?.includes('model'))) {
      console.warn(`Model ${model} failed, falling back to Kimi K2.6:`, err.message);
      const fallbackBody = {
        ...requestBody,
        model: 'mzai:moonshotai/Kimi-K2.6',
      };
      
      try {
        response = await otariClient.chat.completions.create(fallbackBody);
      } catch (fbErr) {
        if (fbErr.status === 502) {
          console.warn(`[Otari API] 502 Bad Gateway on fallback Kimi. Retrying in 1.5s...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          response = await otariClient.chat.completions.create(fallbackBody);
        } else {
          throw fbErr;
        }
      }
      model = 'mzai:moonshotai/Kimi-K2.6';
    } else {
      throw err;
    }
  }

  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  const cost = calculateCost(model, inputTokens, outputTokens);

  const contentBlocks = response.choices?.[0]?.message?.content;
  let answer = '';
  if (typeof contentBlocks === 'string') {
    answer = contentBlocks;
  } else if (Array.isArray(contentBlocks)) {
    answer = contentBlocks
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
  } else {
    answer = response.choices?.[0]?.message?.content || '';
  }

  // Retrieve guardrails verdict from headers if available
  let guardrailVerdict = null;
  if (response.headers) {
    const headersObj = typeof response.headers.get === 'function' 
      ? response.headers 
      : new Headers(response.headers);
    guardrailVerdict = headersObj.get('x-otari-guardrails');
  }

  return {
    answer,
    model,
    inputTokens,
    outputTokens,
    cost,
    usage: response.usage,
    guardrailVerdict,
  };
}

export async function callOtariStream({
  model,
  messages,
  systemPrompt,
  guardrailMode = 'block',
  sessionId,
}) {
  const formattedMessages = [];
  
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  
  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  const requestBody = {
    model: model,
    messages: formattedMessages,
    stream: true,
    extra_body: {
      client_name: sessionId || 'default-session',
      guardrails: [
        { profile: 'prompt-injection', mode: guardrailMode }
      ]
    }
  };

  if (process.env.OTARI_API_KEY === 'mock-key') {
    // Return a mock async iterable stream
    return async function* () {
      const mockWords = "This is a streaming mock response from IRIS Bot!".split(' ');
      for (const word of mockWords) {
        yield { choices: [{ delta: { content: word + ' ' } }] };
        await new Promise(r => setTimeout(r, 50));
      }
    }();
  }

  try {
    const stream = await otariClient.chat.completions.create(requestBody);
    return stream;
  } catch (err) {
    if (model !== 'mzai:moonshotai/Kimi-K2.6' && (err.status === 404 || err.status === 502 || err.message?.includes('not found') || err.message?.includes('model'))) {
      console.warn(`Model ${model} failed, falling back to Kimi K2.6:`, err.message);
      const fallbackBody = { ...requestBody, model: 'mzai:moonshotai/Kimi-K2.6' };
      const fallbackStream = await otariClient.chat.completions.create(fallbackBody);
      return fallbackStream;
    } else {
      throw err;
    }
  }
}
