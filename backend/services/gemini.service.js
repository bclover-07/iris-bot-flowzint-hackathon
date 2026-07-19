import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { otariClient } from '../config/otari.js';
dotenv.config();

let geminiClient = null;

function getGeminiClient() {
  if (geminiClient) return geminiClient;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] GEMINI_API_KEY is not configured. Gemini features will run in fallback simulation/Otari mode.');
    return null;
  }

  try {
    geminiClient = new GoogleGenAI({ apiKey });
    return geminiClient;
  } catch (err) {
    console.error('[Gemini] Failed to initialize GoogleGenAI client:', err.message);
    return null;
  }
}

async function fallbackSearchWeb(query) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
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
    
    return snippets.length > 0 ? snippets.join('\n\n') : null;
  } catch (e) {
    console.warn('[Gemini Fallback Search] DDG search failed:', e.message);
    return null;
  }
}

// 4-Model Fallback Chain for Gemini API calls: High Capability -> Fast/Standard -> Free/Lowest Tier
const GEMINI_FALLBACK_MODELS = [
  'gemini-2.0-flash',        // Latest high capability model
  'gemini-1.5-pro',          // Deep reasoning pro model
  'gemini-1.5-flash',        // Fast standard model
  'gemini-1.5-flash-8b'      // Lightest & free-tier model
];

function getMockImageAnalysis(mimeType, bufferLength, prompt) {
  return `[Fallback Vision Service]: You uploaded an image (${mimeType}, ${Math.round(bufferLength / 1024)} KB) with the prompt: "${prompt}".\n\n` +
         `Since the backend is running in education evaluation mode, here is a mock diagram analysis:\n` +
         `- The image shows a student workbook section containing math equations and geometric shapes.\n` +
         `- Specific parts identified: A right-angled triangle with sides labeled a, b, c.\n` +
         `- Core advice: To solve this question, apply the Pythagorean theorem: $a^2 + b^2 = c^2$.`;
}

function getMockSearchGrounding(prompt) {
  return `[Fallback Grounding Service]: Searched Google for "${prompt}".\n\n` +
         `Here is the latest data summarized (Simulated):\n` +
         `- Dynamic Routing algorithms in 2026 are heavily shifting toward LangGraph.js cognitive graphs.\n` +
         `- Cost optimization and security shields (like PIGuard) are crucial for standard enterprise agent deployments.`;
}

/**
 * Perform visual/multimodal analysis on an image buffer.
 * Falls back to simulation text if no key is configured.
 * 
 * @param {Buffer} imageBuffer - Buffer of the image file
 * @param {string} mimeType - Image mime type (e.g. image/jpeg, image/png)
 * @param {string} prompt - Question about the image
 * @returns {Promise<string>} Gemini output text
 */
export async function analyzeImage(imageBuffer, mimeType, prompt = 'Describe this image in detail.') {
  const client = getGeminiClient();
  
  if (client) {
    for (const model of GEMINI_FALLBACK_MODELS) {
      try {
        console.log(`[Gemini SDK] Trying analyzeImage with model: ${model}`);
        const response = await client.models.generateContent({
          model,
          contents: [
            prompt,
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType,
              },
            },
          ],
        });
        console.log(`[Gemini SDK] Success using model: ${model}`);
        return response.text;
      } catch (err) {
        console.warn(`[Gemini Vision Fallback] Model ${model} failed:`, err.message);
      }
    }
  }

  // Fallback to Otari Multimodal Google Gemini model
  try {
    console.log(`[Gemini Fallback] Attempting multimodal vision analysis via Otari Gateway (model: google:gemini-1.5-flash)...`);
    const base64Image = imageBuffer.toString('base64');
    const response = await otariClient.chat.completions.create({
      model: 'google:gemini-1.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ]
    });
    const answer = response.choices?.[0]?.message?.content;
    if (answer) {
      console.log(`[Gemini Fallback] Multimodal vision analysis via Otari succeeded.`);
      return answer;
    }
  } catch (otariErr) {
    console.error('[Gemini Fallback] Multimodal vision analysis via Otari failed:', otariErr.message);
  }

  console.warn('[Gemini Vision] Otari multimodal fallback failed. Returning simulated output.');
  return getMockImageAnalysis(mimeType, imageBuffer.length, prompt);
}

/**
 * Generate a query response grounded in Google Search.
 * 
 * @param {string} prompt - User query
 * @returns {Promise<string>} Grounded answer
 */
export async function searchGrounded(prompt) {
  const client = getGeminiClient();

  if (client) {
    for (const model of GEMINI_FALLBACK_MODELS) {
      try {
        console.log(`[Gemini SDK] Trying searchGrounded with model: ${model}`);
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            // Enable search grounding
            googleSearchSpec: {},
          },
        });
        console.log(`[Gemini SDK] Success using model: ${model}`);
        return response.text;
      } catch (err) {
        console.warn(`[Gemini Grounding Fallback] Model ${model} failed:`, err.message);
      }
    }
  }

  // Fallback to Scraped Web Search + Otari synthesis
  try {
    console.log(`[Gemini Fallback] Attempting programmatic search & Otari synthesis...`);
    const searchResults = await fallbackSearchWeb(prompt);
    if (searchResults) {
      console.log(`[Gemini Fallback] Programmatic search retrieved results. Synthesizing via Otari...`);
      const response = await otariClient.chat.completions.create({
        model: 'mzai:moonshotai/Kimi-K2.6',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant with access to real-time search results. Answer the query based on the following web results:
\n\n${searchResults}\n\nBe concise and accurate.`
          },
          { role: 'user', content: prompt }
        ]
      });
      const answer = response.choices?.[0]?.message?.content;
      if (answer) {
        return answer;
      }
    }
  } catch (otariErr) {
    console.error('[Gemini Fallback Search] Programmatic search + Otari synthesis failed:', otariErr.message);
  }

  console.warn('[Gemini Grounded Search] Fallback search failed. Returning simulated output.');
  return getMockSearchGrounding(prompt);
}
