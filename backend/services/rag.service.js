import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let knowledgeBase = [];
try {
  const raw = readFileSync(join(__dirname, '../data/knowledge-base.json'), 'utf-8');
  knowledgeBase = JSON.parse(raw);
} catch (e) {
  console.log('No knowledge base found, RAG will be skipped');
}

const responseCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function normalizeQuery(text) {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

const SYNONYMS = {
  'iris': ['ai', 'assistant', 'system', 'bot', 'tool', 'platform'],
  'budget': ['cost', 'money', 'price', 'tokens', 'spent'],
  'route': ['choose', 'select', 'pick', 'decide', 'model'],
  'injection': ['hack', 'security', 'bypass', 'jailbreak', 'piguard'],
};

function expandSynonyms(word) {
  const result = [word];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (key === word) result.push(...syns);
    if (syns.includes(word)) { result.push(key); result.push(...syns); }
  }
  return [...new Set(result)];
}

function tokenOverlap(queryStr, targetStr) {
  const queryTokens = new Set(normalizeQuery(queryStr).split(' '));
  const targetTokens = normalizeQuery(targetStr).split(' ');
  
  let matchScore = 0;
  const uniqueTargetTokens = new Set(targetTokens);

  for (const q of queryTokens) {
    if (q.length < 3) continue;
    const expanded = expandSynonyms(q);
    
    // Check if any expanded synonym exists in the target
    if (expanded.some(syn => uniqueTargetTokens.has(syn))) {
      // Weight domain-specific terms higher (length heuristic)
      matchScore += q.length > 5 ? 1.5 : 1.0;
    }
  }
  
  const validQueryTokens = [...queryTokens].filter(t => t.length >= 3).length;
  if (validQueryTokens === 0) return 0;
  
  return matchScore / Math.max(validQueryTokens, uniqueTargetTokens.size * 0.7);
}

export function searchKnowledgeBase(query) {
  if (knowledgeBase.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    const score = tokenOverlap(query, entry.question || entry.content);
    if (score > bestScore && score > 0.45) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  return bestMatch ? { answer: bestMatch.answer, source: 'knowledge-base', score: bestScore } : null;
}

export function getCachedResponse(query) {
  const key = normalizeQuery(query);
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - new Date(cached.timestamp).getTime() > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return cached;
}

export function setCachedResponse(query, data) {
  const key = normalizeQuery(query);
  responseCache.set(key, { ...data, timestamp: new Date().toISOString() });
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}
