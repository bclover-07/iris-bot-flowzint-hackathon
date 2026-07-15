import { generateEmbedding, cosineSimilarity } from './embedding.service.js';
import { KnowledgeBase } from '../models/KnowledgeBase.model.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const responseCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function normalizeQuery(text) {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Search the knowledge base using vector similarity (semantic search).
 * Falls back to keyword overlap if vectors are not available.
 * 
 * @param {string} query - User's question
 * @param {number} topK - Number of results to return
 * @returns {Promise<{answer: string, source: string, score: number, category: string}|null>}
 */
export async function searchKnowledgeBase(query, topK = 3) {
  try {
    const results = await vectorSearch(query, topK);
    if (results && results.length > 0 && results[0].score > 0.55) {
      return {
        answer: results[0].answer,
        source: 'vector-search',
        score: results[0].score,
        category: results[0].category,
        relatedResults: results.slice(1).map(r => ({
          question: r.question,
          score: r.score,
        })),
      };
    }
  } catch (err) {
    console.warn('[RAG] Vector search failed, falling back to keyword:', err.message);
  }

  return keywordSearch(query);
}

/**
 * Semantic vector search using MongoDB + local embeddings.
 */
async function vectorSearch(query, topK = 3) {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const allDocs = await KnowledgeBase.find({ embedding: { $exists: true, $ne: [] } }).lean();
  if (allDocs.length === 0) return [];

  const scored = allDocs.map(doc => ({
    question: doc.question,
    answer: doc.answer,
    category: doc.category,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Legacy keyword-based search as fallback.
 */
function keywordSearch(query) {
  let knowledgeBase = [];
  try {
    const raw = readFileSync(join(__dirname, '../data/knowledge-base.json'), 'utf-8');
    knowledgeBase = JSON.parse(raw);
  } catch {
    return null;
  }

  if (knowledgeBase.length === 0) return null;

  const SYNONYMS = {
    'iris': ['ai', 'assistant', 'system', 'bot', 'tool', 'platform'],
    'budget': ['cost', 'money', 'price', 'tokens', 'spent'],
    'route': ['choose', 'select', 'pick', 'decide', 'model'],
    'injection': ['hack', 'security', 'bypass', 'jailbreak', 'piguard'],
    'study': ['learn', 'education', 'course', 'class', 'homework'],
    'quiz': ['test', 'exam', 'assessment', 'question', 'practice'],
    'career': ['job', 'work', 'profession', 'salary', 'role'],
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
      if (expanded.some(syn => uniqueTargetTokens.has(syn))) {
        matchScore += q.length > 5 ? 1.5 : 1.0;
      }
    }
    const validQueryTokens = [...queryTokens].filter(t => t.length >= 3).length;
    if (validQueryTokens === 0) return 0;
    return matchScore / Math.max(validQueryTokens, uniqueTargetTokens.size * 0.7);
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    const score = tokenOverlap(query, entry.question || entry.content);
    if (score > bestScore && score > 0.45) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch
    ? { answer: bestMatch.answer, source: 'keyword-search', score: bestScore }
    : null;
}

/**
 * Get cached response for a query.
 */
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

/**
 * Cache a response for future queries.
 */
export function setCachedResponse(query, data) {
  const key = normalizeQuery(query);
  responseCache.set(key, { ...data, timestamp: new Date().toISOString() });
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

/**
 * Seed the MongoDB knowledge base with embeddings from the JSON file.
 * Call this once on server startup or as a migration script.
 */
export async function seedKnowledgeBase() {
  const existingCount = await KnowledgeBase.countDocuments();
  if (existingCount > 0) {
    console.log(`[RAG] Knowledge base already has ${existingCount} entries, skipping seed`);
    return;
  }

  console.log('[RAG] Seeding knowledge base with vector embeddings...');
  let knowledgeBase = [];
  try {
    const raw = readFileSync(join(__dirname, '../data/knowledge-base.json'), 'utf-8');
    knowledgeBase = JSON.parse(raw);
  } catch {
    console.log('[RAG] No knowledge-base.json found');
    return;
  }

  let seeded = 0;
  for (const entry of knowledgeBase) {
    try {
      const embedding = await generateEmbedding(entry.question);
      await KnowledgeBase.create({
        question: entry.question,
        answer: entry.answer,
        category: entry.category || 'education',
        source: 'knowledge-base',
        embedding,
      });
      seeded++;
      if (seeded % 10 === 0) {
        console.log(`[RAG] Seeded ${seeded}/${knowledgeBase.length} entries`);
      }
    } catch (err) {
      console.error(`[RAG] Failed to seed entry: ${entry.question}`, err.message);
    }
  }

  console.log(`[RAG] Seeding complete: ${seeded} entries with embeddings`);
}
