import { pipeline } from '@huggingface/transformers';

let embeddingPipeline = null;
let isLoading = false;

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  if (isLoading) {
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return embeddingPipeline;
  }

  isLoading = true;
  console.log('[Embedding] Loading Xenova/all-MiniLM-L6-v2 model...');
  const startMs = Date.now();

  try {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'fp32',
    });
    console.log(`[Embedding] Model loaded in ${Date.now() - startMs}ms`);
  } catch (err) {
    console.error('[Embedding] Failed to load model:', err.message);
    embeddingPipeline = null;
  } finally {
    isLoading = false;
  }

  return embeddingPipeline;
}

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Uses HuggingFace Transformers.js with all-MiniLM-L6-v2 (runs locally, zero API cost).
 * 
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 384-dimensional float array
 */
export async function generateEmbedding(text) {
  const pipe = await getEmbeddingPipeline();
  if (!pipe) {
    console.warn('[Embedding] Pipeline not available, returning empty vector');
    return [];
  }

  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts in batch.
 * 
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of 384-dimensional vectors
 */
export async function generateEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    results.push(embedding);
  }
  return results;
}

/**
 * Compute cosine similarity between two vectors.
 * 
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} Similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Pre-warm the embedding model on server startup.
 * Call this once during server initialization for faster first query.
 */
export async function warmUpEmbeddingModel() {
  console.log('[Embedding] Pre-warming model...');
  await generateEmbedding('warmup');
  console.log('[Embedding] Model ready');
}
