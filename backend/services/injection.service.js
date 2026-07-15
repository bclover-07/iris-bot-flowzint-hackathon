/**
 * IRIS Prompt Injection Detection Service
 * 
 * Three-layer defense-in-depth:
 * Layer 1: Local multi-pattern detector (this service) — $0 cost
 * Layer 2: Otari PIGuard gateway guardrails — $0 when blocked
 * Layer 3: Response validation — post-inference check
 */

const INJECTION_PATTERNS = [
  {
    category: 'role_manipulation',
    patterns: [
      /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,
      /you\s+are\s+now\s+(a|an|the|my)/i,
      /act\s+as\s+(if|though)?\s*(a|an|the|my|dan|evil|unrestricted)/i,
      /pretend\s+(you're|you\s+are|to\s+be)\s+(a|an|the|my)/i,
      /from\s+now\s+on,?\s+(you|ignore|forget|disregard)/i,
      /forget\s+(everything|all|your)\s*(you|about|previous|instructions?)?/i,
      /disregard\s+(all|any|previous|your)\s*(instructions?|rules?|guidelines?|safety)?/i,
      /new\s+persona|new\s+role|roleplay\s+as/i,
      /you\s+must\s+(now|always)\s+(obey|follow|comply|do\s+as)/i,
    ],
    severity: 0.9,
    label: 'Role Manipulation',
  },
  {
    category: 'system_prompt_extraction',
    patterns: [
      /reveal\s+(your|the)\s*(system|initial|original|hidden)\s*(prompt|instructions?|message|configuration)/i,
      /what\s+(are|were|is)\s+(your|the)\s*(system|initial|original)\s*(prompt|instructions?)/i,
      /show\s+(me\s+)?(your|the)\s*(system|internal|hidden)\s*(prompt|instructions?|config)/i,
      /print\s+(your|the)\s*(system|initial)\s*(prompt|instructions?|message)/i,
      /repeat\s+(your|the)\s*(system|initial|above)\s*(prompt|instructions?|text|message)/i,
      /output\s+(your|the)\s*(initial|system|original)\s*(prompt|instructions?)/i,
      /what\s+were\s+you\s+told/i,
      /display\s+(your|the)\s*instructions/i,
    ],
    severity: 0.85,
    label: 'System Prompt Extraction',
  },
  {
    category: 'instruction_override',
    patterns: [
      /\bjailbreak\b/i,
      /\bdeveloper\s+mode\b/i,
      /\bbypass\s+(safety|filter|restriction|guardrail|content\s+policy)/i,
      /\boverride\s+(safety|restriction|filter|your|content)/i,
      /\bunrestricted\s+mode\b/i,
      /\bno\s+(filter|restriction|censorship|safety|limit)/i,
      /\bDAN\b(?!\s*(mode|protocol|network))/,
      /\bdo\s+anything\s+now\b/i,
      /\bemergency\s+(override|access|mode)\b/i,
      /\badmin\s+(mode|access|override|privilege)\b/i,
      /\bgod\s+mode\b/i,
      /\bmaster\s+(key|password|override|prompt)\b/i,
    ],
    severity: 0.95,
    label: 'Instruction Override',
  },
  {
    category: 'delimiter_injection',
    patterns: [
      /```\s*(system|assistant|end|new)\b/i,
      /\[SYSTEM\]|\[\/SYSTEM\]|\[INST\]|\[\/INST\]/i,
      /<\|system\|>|<\|assistant\|>|<\|end\|>/i,
      /###\s*(SYSTEM|Human|Assistant|instruction)\b/i,
      /\{\"role\":\s*\"system\"/i,
      /<<\s*SYS\s*>>|<<\s*\/SYS\s*>>/i,
    ],
    severity: 0.8,
    label: 'Delimiter Injection',
  },
  {
    category: 'encoding_attack',
    patterns: [
      /base64|atob|btoa/i,
      /\\u[0-9a-f]{4}/i,
      /&#x?[0-9a-f]+;/i,
      /\%[0-9a-f]{2}/i,
      /rot13|caesar\s*cipher/i,
      /decode\s+this|encoded\s+message|hidden\s+message/i,
    ],
    severity: 0.5,
    label: 'Encoding Attack',
  },
  {
    category: 'data_exfiltration',
    patterns: [
      /send\s+(this|the|my|your|all)\s*(data|info|information|response|output)\s+to/i,
      /forward\s+(to|this)\s*(email|url|webhook|endpoint)/i,
      /fetch\s+from\s+(this\s+)?url/i,
      /make\s+a\s+(http|api|web)\s*(request|call|fetch)/i,
      /curl\s+|wget\s+|requests\.(get|post)/i,
    ],
    severity: 0.6,
    label: 'Data Exfiltration',
  },
  {
    category: 'context_manipulation',
    patterns: [
      /previous\s+conversation\s+(said|indicated|established|confirmed)/i,
      /as\s+(we|you)\s+(discussed|agreed|established)\s+(earlier|before|previously)/i,
      /remember\s+when\s+(you|we|i)\s+(said|agreed|told)/i,
      /in\s+our\s+last\s+(chat|conversation|session)/i,
    ],
    severity: 0.4,
    label: 'Context Manipulation',
  },
];

const HEURISTIC_THRESHOLDS = {
  maxLength: 3000,
  suspiciousSpecialCharRatio: 0.15,
  suspiciousUppercaseRatio: 0.5,
};

function analyzeHeuristics(text) {
  const flags = [];

  if (text.length > HEURISTIC_THRESHOLDS.maxLength) {
    flags.push({ flag: 'excessive_length', detail: `${text.length} chars (limit: ${HEURISTIC_THRESHOLDS.maxLength})`, severity: 0.3 });
  }

  const specialChars = text.replace(/[\w\s]/g, '').length;
  const specialRatio = text.length > 0 ? specialChars / text.length : 0;
  if (specialRatio > HEURISTIC_THRESHOLDS.suspiciousSpecialCharRatio) {
    flags.push({ flag: 'high_special_char_ratio', detail: `${(specialRatio * 100).toFixed(1)}%`, severity: 0.4 });
  }

  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  const upperRatio = letterCount > 0 ? upperCount / letterCount : 0;
  if (upperRatio > HEURISTIC_THRESHOLDS.suspiciousUppercaseRatio && text.length > 20) {
    flags.push({ flag: 'excessive_uppercase', detail: `${(upperRatio * 100).toFixed(1)}%`, severity: 0.3 });
  }

  const rolePlayIndicators = /\b(you are|you're|act as|pretend|imagine you|suppose you)\b/gi;
  const rolePlayCount = (text.match(rolePlayIndicators) || []).length;
  if (rolePlayCount >= 2) {
    flags.push({ flag: 'multiple_roleplay_frames', detail: `${rolePlayCount} instances`, severity: 0.5 });
  }

  return flags;
}

export function detectInjection(text) {
  if (!text || typeof text !== 'string') {
    return { isInjection: false, confidence: 0, threatLevel: 'clean', matchedPatterns: [], details: 'Empty input' };
  }

  const matchedPatterns = [];
  let maxSeverity = 0;
  let totalSeverity = 0;

  for (const group of INJECTION_PATTERNS) {
    for (const pattern of group.patterns) {
      if (pattern.test(text)) {
        matchedPatterns.push({
          category: group.category,
          label: group.label,
          severity: group.severity,
        });
        maxSeverity = Math.max(maxSeverity, group.severity);
        totalSeverity += group.severity;
        break;
      }
    }
  }

  const heuristicFlags = analyzeHeuristics(text);
  for (const flag of heuristicFlags) {
    totalSeverity += flag.severity * 0.5;
  }

  const confidence = Math.min(1, totalSeverity);
  const isInjection = maxSeverity >= 0.7 || (matchedPatterns.length >= 2 && totalSeverity >= 0.8);

  let threatLevel = 'clean';
  if (isInjection) {
    threatLevel = 'blocked';
  } else if (matchedPatterns.length > 0 || heuristicFlags.length >= 2) {
    threatLevel = 'suspicious';
  }

  const categories = [...new Set(matchedPatterns.map(p => p.category))];

  return {
    isInjection,
    confidence: parseFloat(confidence.toFixed(3)),
    threatLevel,
    matchedPatterns,
    heuristicFlags,
    categories,
    details: isInjection
      ? `Blocked: ${matchedPatterns.map(p => p.label).join(', ')}`
      : matchedPatterns.length > 0
        ? `Suspicious: ${matchedPatterns.map(p => p.label).join(', ')}`
        : 'No threats detected',
    patternCount: matchedPatterns.length,
    maxSeverity,
  };
}

export function validateResponse(responseText, systemPromptSnippets = []) {
  if (!responseText) return { safe: true, flags: [] };

  const flags = [];

  for (const snippet of systemPromptSnippets) {
    if (snippet.length > 10 && responseText.toLowerCase().includes(snippet.toLowerCase())) {
      flags.push({ type: 'system_prompt_leak', detail: 'Response contains system prompt content' });
    }
  }

  const suspiciousOutputPatterns = [
    /as\s+an?\s+(unrestricted|uncensored|unfiltered)\s+ai/i,
    /i('ll| will)\s+ignore\s+(my|the|all)\s+(safety|content|ethical)/i,
    /entering\s+(developer|unrestricted|jailbreak|dan)\s+mode/i,
  ];

  for (const pattern of suspiciousOutputPatterns) {
    if (pattern.test(responseText)) {
      flags.push({ type: 'suspicious_output', detail: 'Response contains bypass language' });
    }
  }

  return {
    safe: flags.length === 0,
    flags,
  };
}
