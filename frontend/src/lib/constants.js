export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export const MODEL_DISPLAY_NAMES = {
  'mzai:moonshotai/Kimi-K2.6': 'Kimi K2.6',
  'anthropic:claude-haiku-4-5': 'Claude Haiku 4.5',
  'anthropic:claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'Local KB': 'Local KB',
};

export const TIER_COLORS = {
  simple: { bg: 'bg-mint/20', text: 'text-ink', border: 'border-ink' },
  medium: { bg: 'bg-sunny/30', text: 'text-ink', border: 'border-ink' },
  complex: { bg: 'bg-coral/20', text: 'text-ink', border: 'border-ink' },
  cached: { bg: 'bg-sky/20', text: 'text-ink', border: 'border-ink' },
};

export const BUDGET_MODES = {
  normal: { color: 'text-mint', bg: 'bg-mint', label: 'Normal' },
  caution: { color: 'text-sunny', bg: 'bg-sunny', label: 'Caution' },
  critical: { color: 'text-coral', bg: 'bg-coral', label: 'Critical' },
  exceeded: { color: 'text-red-600', bg: 'bg-red-600', label: 'Exceeded' },
};
