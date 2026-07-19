/**
 * IRIS Bot Dynamic Prompt Analyzer — Multi-Signal Classification Engine
 * 
 * Replaces the hardcoded regex classifier with a multi-dimensional analysis system.
 * Considers: vocabulary richness, syntactic complexity, domain detection,
 * intent classification, context window requirements, and attention word extraction.
 */

import {
  SCORING_WEIGHTS,
  TIER_BOUNDARIES,
  DOMAIN_KEYWORDS,
  INTENT_PATTERNS,
  COMPLEXITY_MODIFIERS,
  MODEL_CAPABILITIES,
} from '../config/routing.config.js';
import { MODELS } from '../config/otari.js';

function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function analyzeLexicalComplexity(text, words) {
  const uniqueWords = new Set(words);
  const ttr = words.length > 0 ? uniqueWords.size / words.length : 0;
  const avgWordLength = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;
  const longWords = words.filter(w => w.length > 8).length;
  const longWordRatio = words.length > 0 ? longWords / words.length : 0;

  let score = 0;
  score += ttr * 40;
  score += Math.min(avgWordLength / 10, 1) * 30;
  score += longWordRatio * 30;

  return {
    score: Math.min(100, score),
    ttr: parseFloat(ttr.toFixed(3)),
    avgWordLength: parseFloat(avgWordLength.toFixed(1)),
    longWordRatio: parseFloat(longWordRatio.toFixed(3)),
  };
}

function analyzeSyntacticComplexity(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const questionCount = (text.match(/\?/g) || []).length;
  const clauseIndicators = (text.match(/\b(and|but|or|because|although|however|therefore|moreover|furthermore|while|whereas|unless|if|when|since)\b/gi) || []).length;
  const nestedStructures = (text.match(/\([^)]+\)/g) || []).length;

  let score = 0;
  score += Math.min(sentenceCount * 8, 30);
  score += Math.min(questionCount * 12, 25);
  score += Math.min(clauseIndicators * 6, 25);
  score += Math.min(nestedStructures * 10, 20);

  return {
    score: Math.min(100, score),
    sentenceCount,
    questionCount,
    clauseIndicators,
  };
}

function detectDomain(words, text) {
  const wordSet = new Set(words);
  let bestDomain = 'general';
  let bestScore = 0;
  const domainScores = {};

  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    let matches = 0;
    const matchedTerms = [];

    for (const term of config.terms) {
      if (term.includes(' ')) {
        if (text.toLowerCase().includes(term)) {
          matches += 2;
          matchedTerms.push(term);
        }
      } else if (wordSet.has(term)) {
        matches++;
        matchedTerms.push(term);
      }
    }

    const score = (matches / Math.max(config.terms.length, 1)) * 100 * config.weight;
    domainScores[domain] = { score: parseFloat(score.toFixed(2)), matches, matchedTerms };

    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  return {
    primaryDomain: bestDomain,
    confidence: Math.min(bestScore, 100),
    domainScores,
  };
}

function classifyIntent(text, words) {
  let bestIntent = 'general';
  let bestScore = 0;
  const intentDetails = {};

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        score += 50;
        break;
      }
    }

    const wordSet = new Set(words);
    let keywordMatches = 0;
    for (const keyword of config.keywords) {
      if (keyword.includes(' ')) {
        if (text.toLowerCase().includes(keyword)) keywordMatches++;
      } else if (wordSet.has(keyword)) {
        keywordMatches++;
      }
    }
    score += Math.min(keywordMatches * 15, 50);

    intentDetails[intent] = { score, complexity: config.complexity };

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const matched = INTENT_PATTERNS[bestIntent];
  return {
    intent: bestIntent,
    confidence: Math.min(bestScore, 100),
    complexity: matched ? matched.complexity : 0.3,
    estimatedResponseTokens: matched ? matched.estimatedResponseTokens : 200,
    details: intentDetails,
  };
}

function extractAttentionWords(words, text, domainResult) {
  const stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'a', 'an', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
    'at', 'by', 'for', 'in', 'of', 'on', 'to', 'up', 'it',
    'its', 'my', 'we', 'our', 'he', 'she', 'they', 'them',
    'this', 'that', 'these', 'those', 'with', 'from', 'about',
    'what', 'how', 'why', 'when', 'where', 'who', 'which',
    'me', 'you', 'your', 'i', 'if', 'then', 'than', 'more',
    'also', 'just', 'very', 'really', 'some', 'any', 'all',
    'each', 'every', 'both', 'few', 'many', 'much', 'most',
    'other', 'another', 'such', 'only', 'own', 'same', 'tell',
    'please', 'explain', 'describe', 'give', 'make', 'write',
  ]);

  const wordFreq = {};
  for (const w of words) {
    if (w.length > 2 && !stopWords.has(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }

  const domainMatched = domainResult.domainScores[domainResult.primaryDomain]?.matchedTerms || [];
  for (const term of domainMatched) {
    const key = term.toLowerCase();
    wordFreq[key] = (wordFreq[key] || 0) + 3;
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function applyComplexityModifiers(text, words) {
  const modifiers = [];
  let totalBonus = 0;

  if (COMPLEXITY_MODIFIERS.multiPart.signal.test(text)) {
    totalBonus += COMPLEXITY_MODIFIERS.multiPart.bonus;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.multiPart.label, effect: `+${COMPLEXITY_MODIFIERS.multiPart.bonus}` });
  }

  if (COMPLEXITY_MODIFIERS.multiStep.signal.test(text)) {
    totalBonus += COMPLEXITY_MODIFIERS.multiStep.bonus;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.multiStep.label, effect: `+${COMPLEXITY_MODIFIERS.multiStep.bonus}` });
  }

  for (const threshold of COMPLEXITY_MODIFIERS.longPrompt.thresholds) {
    if (words.length > threshold.words) {
      totalBonus += threshold.bonus;
      modifiers.push({ label: `${COMPLEXITY_MODIFIERS.longPrompt.label} (${words.length} words)`, effect: `+${threshold.bonus}` });
      break;
    }
  }

  if (COMPLEXITY_MODIFIERS.webSearchNeeded.signal.test(text)) {
    totalBonus += COMPLEXITY_MODIFIERS.webSearchNeeded.bonus;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.webSearchNeeded.label, effect: `+${COMPLEXITY_MODIFIERS.webSearchNeeded.bonus}` });
  }

  if (COMPLEXITY_MODIFIERS.withExamples.signal.test(text)) {
    totalBonus += COMPLEXITY_MODIFIERS.withExamples.bonus;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.withExamples.label, effect: `+${COMPLEXITY_MODIFIERS.withExamples.bonus}` });
  }

  if (COMPLEXITY_MODIFIERS.exhaustive.signal.test(text)) {
    totalBonus += COMPLEXITY_MODIFIERS.exhaustive.bonus;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.exhaustive.label, effect: `+${COMPLEXITY_MODIFIERS.exhaustive.bonus}` });
  }

  if (words.length <= COMPLEXITY_MODIFIERS.shortFactual.maxWords) {
    totalBonus += COMPLEXITY_MODIFIERS.shortFactual.penalty;
    modifiers.push({ label: COMPLEXITY_MODIFIERS.shortFactual.label, effect: `${COMPLEXITY_MODIFIERS.shortFactual.penalty}` });
  }

  const needsWebSearch = COMPLEXITY_MODIFIERS.webSearchNeeded.signal.test(text);

  return { totalBonus, modifiers, needsWebSearch };
}

function calculateWeightedScore(dimensions) {
  let weightedSum = 0;

  weightedSum += (dimensions.lexical.score / 100) * SCORING_WEIGHTS.lexicalComplexity;
  weightedSum += (dimensions.syntactic.score / 100) * SCORING_WEIGHTS.syntacticComplexity;
  weightedSum += (dimensions.domain.confidence / 100) * SCORING_WEIGHTS.domainSpecificity;
  weightedSum += dimensions.intent.complexity * SCORING_WEIGHTS.intentComplexity;

  const lengthScore = Math.min(dimensions.wordCount / 80, 1);
  weightedSum += lengthScore * SCORING_WEIGHTS.lengthSignal;

  const contextScore = Math.min(dimensions.intent.estimatedResponseTokens / 1200, 1);
  weightedSum += contextScore * SCORING_WEIGHTS.contextRequirement;

  const specialScore = Math.min(Math.abs(dimensions.modifiers.totalBonus) / 30, 1);
  weightedSum += specialScore * SCORING_WEIGHTS.specialSignals;

  let baseScore = weightedSum * 100;
  baseScore += dimensions.modifiers.totalBonus;

  return Math.max(0, Math.min(100, Math.round(baseScore)));
}

function determineTier(score) {
  if (score < TIER_BOUNDARIES.simple.max) return 'simple';
  if (score < TIER_BOUNDARIES.complex.min) return 'medium';
  return 'complex';
}

function buildRoutingReason(tier, score, dimensions) {
  const parts = [];

  const intentLabel = dimensions.intent.intent.replace(/_/g, ' ');
  parts.push(`${intentLabel} detected`);

  if (dimensions.domain.primaryDomain !== 'general') {
    parts.push(`domain: ${dimensions.domain.primaryDomain}`);
  }

  if (dimensions.attentionWords.length > 0) {
    parts.push(`key terms: ${dimensions.attentionWords.slice(0, 3).join(', ')}`);
  }

  parts.push(`~${dimensions.intent.estimatedResponseTokens} tokens expected`);

  const tierLabels = {
    simple: 'Simple query',
    medium: 'Medium complexity',
    complex: 'Complex query',
  };

  return `${tierLabels[tier]} · score ${score}/100 · ${parts.join(' · ')}`;
}

function detectHindiOrHinglish(text, words) {
  const hasDevnagari = /[\u0900-\u097F]/.test(text);
  if (hasDevnagari) return true;

  const HINGLISH_KEYWORDS = new Set([
    'kya', 'kaise', 'batao', 'samjhao', 'hai', 'tha', 'he', 'hu', 'mushkil', 'aasan', 'sikhna', 'padhna',
    'karo', 'karna', 'bataiye', 'samjhaiye', 'nhi', 'nahi', 'kuch', 'bata', 'sakte', 'ho', 'bhai', 'yaar',
    'kaise', 'kab', 'kaha', 'kahan', 'kyu', 'kyon', 'kon', 'kaun', 'iska', 'uska', 'karke', 'banao', 'banaye'
  ]);
  
  let matchCount = 0;
  for (const word of words) {
    if (HINGLISH_KEYWORDS.has(word)) {
      matchCount++;
    }
  }
  return matchCount >= 2;
}

export function classifyPrompt(text) {
  const words = tokenize(text);
  const wordCount = words.length;

  const lexical = analyzeLexicalComplexity(text, words);
  const syntactic = analyzeSyntacticComplexity(text);
  const domain = detectDomain(words, text);
  const intent = classifyIntent(text, words);
  const modifiers = applyComplexityModifiers(text, words);
  const attentionWords = extractAttentionWords(words, text, domain);

  const isHindi = detectHindiOrHinglish(text, words);
  if (isHindi) {
    modifiers.modifiers.push({ label: 'Hindi / Hinglish Language', effect: 'Language match' });
  }

  const dimensions = {
    lexical,
    syntactic,
    domain,
    intent,
    modifiers,
    attentionWords,
    wordCount,
  };

  const score = calculateWeightedScore(dimensions);
  const tier = determineTier(score);
  const reason = buildRoutingReason(tier, score, dimensions);

  const modelKey = tier.toUpperCase();
  const selectedModel = MODELS[modelKey];
  const modelCapabilities = MODEL_CAPABILITIES[selectedModel];

  const worstCaseModel = MODELS.COMPLEX;
  const worstCaseCap = MODEL_CAPABILITIES[worstCaseModel];
  const estimatedInputTokens = Math.ceil(wordCount * 1.3);
  const estimatedOutputTokens = intent.estimatedResponseTokens;

  const estimatedCost = (estimatedInputTokens / 1_000_000 * modelCapabilities.costPerMillionInput)
    + (estimatedOutputTokens / 1_000_000 * modelCapabilities.costPerMillionOutput);
  const worstCaseCost = (estimatedInputTokens / 1_000_000 * worstCaseCap.costPerMillionInput)
    + (estimatedOutputTokens / 1_000_000 * worstCaseCap.costPerMillionOutput);

  return {
    tier,
    score,
    reason,
    signals: {
      needsWebSearch: modifiers.needsWebSearch,
      hasCode: intent.intent === 'code_generation' || intent.intent === 'debugging',
      isFactual: intent.intent === 'factual_lookup',
      isComparison: intent.intent === 'comparison',
      isDebate: intent.intent === 'analysis',
      hasMultiPart: modifiers.modifiers.some(m => m.label.includes('Multi-part')),
      isHindi,
    },
    analysis: {
      lexicalComplexity: lexical.score,
      syntacticComplexity: syntactic.score,
      domain: domain.primaryDomain,
      domainConfidence: domain.confidence,
      intent: intent.intent,
      intentConfidence: intent.confidence,
      estimatedResponseTokens: estimatedOutputTokens,
      attentionWords,
      modifiers: modifiers.modifiers,
      wordCount,
      isHindi,
    },
    costProjection: {
      estimatedCost: parseFloat(estimatedCost.toFixed(8)),
      worstCaseCost: parseFloat(worstCaseCost.toFixed(8)),
      potentialSavings: parseFloat((worstCaseCost - estimatedCost).toFixed(8)),
      savingsPercent: worstCaseCost > 0
        ? parseFloat(((1 - estimatedCost / worstCaseCost) * 100).toFixed(1))
        : 0,
    },
  };
}
