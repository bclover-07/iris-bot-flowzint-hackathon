import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let geminiClient = null;

function getGeminiClient() {
  if (geminiClient) return geminiClient;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] GEMINI_API_KEY is not configured. Gemini features will run in fallback simulation mode.');
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
  
  if (!client) {
    console.log('[Gemini SDK] API key not found. Simulating image analysis...');
    await new Promise(r => setTimeout(r, 1000));
    return getMockImageAnalysis(mimeType, imageBuffer.length, prompt);
  }

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

  console.error('[Gemini Vision] All models in fallback chain failed. Returning simulated output.');
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

  if (!client) {
    console.log('[Gemini SDK] API key not found. Simulating search grounding...');
    await new Promise(r => setTimeout(r, 1000));
    return getMockSearchGrounding(prompt);
  }

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

  console.error('[Gemini Grounded Search] All models in fallback chain failed. Returning simulated output.');
  return getMockSearchGrounding(prompt);
}
