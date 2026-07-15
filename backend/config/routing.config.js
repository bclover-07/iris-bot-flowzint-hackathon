/**
 * IRIS Bot Smart Routing Configuration
 * All routing weights, thresholds, and model capabilities are configurable here.
 * No hardcoded magic numbers in the classifier.
 */

export const MODEL_CAPABILITIES = {
  'mzai:moonshotai/Kimi-K2.6': {
    displayName: 'Kimi K2.6',
    tier: 'simple',
    contextWindow: 131072,
    strengths: ['fast responses', 'factual lookup', 'short answers', 'definitions'],
    maxResponseTokens: 4096,
    avgLatencyMs: 800,
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.14,
  },
  'anthropic:claude-haiku-4-5': {
    displayName: 'Claude Haiku 4.5',
    tier: 'medium',
    contextWindow: 200000,
    strengths: ['explanations', 'comparisons', 'multi-step reasoning', 'summaries'],
    maxResponseTokens: 8192,
    avgLatencyMs: 1500,
    costPerMillionInput: 0.25,
    costPerMillionOutput: 1.25,
  },
  'anthropic:claude-sonnet-4-6': {
    displayName: 'Claude Sonnet 4.6',
    tier: 'complex',
    contextWindow: 200000,
    strengths: ['code generation', 'deep analysis', 'essays', 'research', 'creative writing'],
    maxResponseTokens: 16384,
    avgLatencyMs: 3000,
    costPerMillionInput: 3.00,
    costPerMillionOutput: 15.00,
  },
};

export const SCORING_WEIGHTS = {
  lexicalComplexity: 0.15,
  syntacticComplexity: 0.15,
  domainSpecificity: 0.10,
  intentComplexity: 0.25,
  lengthSignal: 0.10,
  contextRequirement: 0.15,
  specialSignals: 0.10,
};

export const TIER_BOUNDARIES = {
  simple: { max: 35 },
  medium: { min: 35, max: 68 },
  complex: { min: 68 },
};

export const DOMAIN_KEYWORDS = {
  programming: {
    weight: 1.2,
    terms: [
      'code', 'function', 'class', 'variable', 'array', 'object', 'loop',
      'algorithm', 'api', 'rest', 'graphql', 'database', 'sql', 'nosql',
      'javascript', 'python', 'java', 'typescript', 'react', 'node',
      'css', 'html', 'webpack', 'docker', 'git', 'deploy', 'debug',
      'compile', 'runtime', 'syntax', 'backend', 'frontend', 'fullstack',
      'express', 'django', 'flask', 'spring', 'mongodb', 'postgresql',
      'redis', 'microservice', 'oauth', 'jwt', 'middleware', 'cors',
      'async', 'await', 'promise', 'callback', 'closure', 'prototype',
      'inheritance', 'polymorphism', 'encapsulation', 'abstraction',
      'recursion', 'sorting', 'binary', 'tree', 'graph', 'stack', 'queue',
      'linked list', 'hash', 'regex', 'refactor', 'testing', 'unit test',
    ],
  },
  mathematics: {
    weight: 1.1,
    terms: [
      'calculus', 'algebra', 'geometry', 'trigonometry', 'statistics',
      'probability', 'integral', 'derivative', 'matrix', 'vector',
      'equation', 'theorem', 'proof', 'logarithm', 'exponent', 'factorial',
      'permutation', 'combination', 'regression', 'correlation', 'variance',
      'standard deviation', 'mean', 'median', 'mode', 'polynomial',
      'quadratic', 'linear', 'differential', 'limit', 'convergence',
      'series', 'sequence', 'set theory', 'boolean', 'discrete math',
    ],
  },
  science: {
    weight: 1.0,
    terms: [
      'physics', 'chemistry', 'biology', 'atom', 'molecule', 'cell',
      'dna', 'rna', 'protein', 'evolution', 'gravity', 'force', 'energy',
      'thermodynamics', 'quantum', 'relativity', 'photosynthesis',
      'mitosis', 'meiosis', 'ecosystem', 'periodic table', 'element',
      'compound', 'reaction', 'catalyst', 'electron', 'proton', 'neutron',
      'wavelength', 'frequency', 'electromagnetic', 'organic', 'inorganic',
    ],
  },
  humanities: {
    weight: 0.9,
    terms: [
      'history', 'philosophy', 'literature', 'sociology', 'psychology',
      'economics', 'political', 'culture', 'civilization', 'revolution',
      'democracy', 'capitalism', 'socialism', 'ethics', 'morality',
      'renaissance', 'enlightenment', 'colonialism', 'globalization',
      'anthropology', 'linguistics', 'semiotics', 'rhetoric', 'narrative',
    ],
  },
  creative: {
    weight: 1.0,
    terms: [
      'write', 'essay', 'poem', 'story', 'creative', 'narrative',
      'character', 'plot', 'setting', 'theme', 'metaphor', 'simile',
      'alliteration', 'imagery', 'tone', 'voice', 'perspective',
      'dialogue', 'fiction', 'nonfiction', 'draft', 'outline',
    ],
  },
};

export const INTENT_PATTERNS = {
  factual_lookup: {
    complexity: 0.1,
    patterns: [
      /^(what is|define|who is|when did|where is|capital of|who was|what does|how many|when was|name the|list the)/i,
    ],
    keywords: ['definition', 'meaning', 'stands for', 'abbreviation'],
    estimatedResponseTokens: 100,
  },
  explanation: {
    complexity: 0.4,
    patterns: [
      /^(explain|describe|how does|why does|what happens|tell me about|walk me through)/i,
    ],
    keywords: ['explain', 'describe', 'elaborate', 'clarify', 'understand', 'how it works'],
    estimatedResponseTokens: 400,
  },
  comparison: {
    complexity: 0.55,
    patterns: [
      /compare|difference between|vs\.?|versus|pros.*cons|advantages.*disadvantages|which is better/i,
    ],
    keywords: ['compare', 'contrast', 'difference', 'versus', 'similarities'],
    estimatedResponseTokens: 600,
  },
  analysis: {
    complexity: 0.7,
    patterns: [
      /argue|debate|analyze|evaluate|critically|discuss|assess|examine|investigate/i,
    ],
    keywords: ['analyze', 'evaluate', 'critique', 'assess', 'implications', 'impact'],
    estimatedResponseTokens: 800,
  },
  code_generation: {
    complexity: 0.85,
    patterns: [
      /write.*code|create.*function|implement|build.*app|develop|program|code.*for|script.*that/i,
      /```|function\s*\(|class\s+\w|import\s+|def\s+\w|for\s*\(|while\s*\(|=>\s*\{|async\s+/,
    ],
    keywords: ['implement', 'build', 'create', 'develop', 'write code', 'program'],
    estimatedResponseTokens: 1200,
  },
  translation: {
    complexity: 0.3,
    patterns: [
      /translate|convert.*to.*language|in (spanish|french|german|hindi|chinese|japanese|korean|arabic)/i,
    ],
    keywords: ['translate', 'translation', 'language'],
    estimatedResponseTokens: 200,
  },
  summarization: {
    complexity: 0.35,
    patterns: [
      /summarize|summary|tldr|tl;dr|brief|shorten|condense|key points/i,
    ],
    keywords: ['summarize', 'summary', 'brief', 'condense', 'key points', 'overview'],
    estimatedResponseTokens: 300,
  },
  creative_writing: {
    complexity: 0.75,
    patterns: [
      /write.*essay|write.*story|write.*poem|compose|draft.*letter|create.*content/i,
    ],
    keywords: ['essay', 'story', 'poem', 'compose', 'draft', 'creative'],
    estimatedResponseTokens: 1000,
  },
  math_solving: {
    complexity: 0.6,
    patterns: [
      /solve|calculate|compute|find the value|what is \d|evaluate.*expression|simplify/i,
      /\d+\s*[\+\-\*\/\^]\s*\d+/,
    ],
    keywords: ['solve', 'calculate', 'compute', 'equation', 'formula'],
    estimatedResponseTokens: 300,
  },
  debugging: {
    complexity: 0.8,
    patterns: [
      /fix.*bug|debug|error.*in|not working|fails|crash|exception|issue with/i,
    ],
    keywords: ['bug', 'debug', 'error', 'fix', 'broken', 'issue', 'crash', 'exception'],
    estimatedResponseTokens: 800,
  },
};

export const COMPLEXITY_MODIFIERS = {
  multiPart: { signal: /\?.*\?/s, bonus: 15, label: 'Multi-part question' },
  multiStep: { signal: /\b(step by step|step-by-step|first.*then|1\).*2\))\b/i, bonus: 12, label: 'Multi-step request' },
  longPrompt: { thresholds: [{ words: 100, bonus: 12 }, { words: 60, bonus: 8 }, { words: 30, bonus: 5 }], label: 'Prompt length' },
  webSearchNeeded: { signal: /latest|current|2025|2026|2027|today|recent|news|price of|salary|trending/i, bonus: 8, label: 'Needs current data' },
  withExamples: { signal: /\b(example|for instance|such as|e\.g\.|i\.e\.)\b/i, bonus: 5, label: 'Requests examples' },
  exhaustive: { signal: /\b(all|every|complete|comprehensive|thorough|detailed|in-depth|exhaustive)\b/i, bonus: 8, label: 'Exhaustive answer needed' },
  shortFactual: { maxWords: 8, penalty: -15, label: 'Very short factual query' },
};
