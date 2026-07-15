import { GoogleGenAI } from '@google/genai';

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
    await new Promise(r => setTimeout(r, 1200));
    return `[Fallback Vision Service]: You uploaded an image (${mimeType}, ${Math.round(imageBuffer.length / 1024)} KB) with the prompt: "${prompt}".\n\n` +
           `Since the backend is running in education evaluation mode, here is a mock diagram analysis:\n` +
           `- The image shows a student workbook section containing math equations and geometric shapes.\n` +
           `- Specific parts identified: A right-angled triangle with sides labeled a, b, c.\n` +
           `- Core advice: To solve this question, apply the Pythagorean theorem: $a^2 + b^2 = c^2$.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
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
    return response.text;
  } catch (err) {
    console.error('[Gemini Vision Error]:', err.message);
    throw new Error(`Gemini Multimodal Analysis failed: ${err.message}`);
  }
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
    return `[Fallback Grounding Service]: Searched Google for "${prompt}".\n\n` +
           `Here is the latest data summarized (Simulated):\n` +
           `- Dynamic Routing algorithms in 2026 are heavily shifting toward LangGraph.js cognitive graphs.\n` +
           `- Cost optimization and security shields (like PIGuard) are crucial for standard enterprise agent deployments.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        // Enable search grounding
        googleSearchSpec: {},
      },
    });
    return response.text;
  } catch (err) {
    console.error('[Gemini Grounded Search Error]:', err.message);
    throw new Error(`Gemini Grounded Search failed: ${err.message}`);
  }
}
