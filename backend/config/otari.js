import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export const otariClient = new OpenAI({
  apiKey: process.env.OTARI_API_KEY,
  baseURL: process.env.OTARI_BASE_URL,
});

export const MODELS = {
  SIMPLE: 'mzai:moonshotai/Kimi-K2.6',
  MEDIUM: 'anthropic:claude-haiku-4-5',
  COMPLEX: 'anthropic:claude-sonnet-4-6',
};

export const COST_TABLE = {
  'mzai:moonshotai/Kimi-K2.6':    { input: 0.14,  output: 0.14  },
  'anthropic:claude-haiku-4-5':   { input: 0.25,  output: 1.25  },
  'anthropic:claude-sonnet-4-6':  { input: 3.00,  output: 15.00 },
};

export function calculateCost(model, inputTokens, outputTokens) {
  const rates = COST_TABLE[model] || { input: 0.14, output: 0.14 };
  return (inputTokens / 1_000_000 * rates.input) + (outputTokens / 1_000_000 * rates.output);
}
