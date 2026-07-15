'use client';
import { motion } from 'framer-motion';

const EMOJI_MAP = {
  VERY_POSITIVE: { emoji: '😊', label: 'Very Positive', color: 'bg-mint text-ink' },
  POSITIVE: { emoji: '🙂', label: 'Positive', color: 'bg-mint/40 text-ink' },
  NEUTRAL: { emoji: '😐', label: 'Neutral', color: 'bg-cream text-ink/70' },
  SLIGHTLY_NEGATIVE: { emoji: '😐', label: 'Neutral', color: 'bg-cream text-ink/70' },
  FRUSTRATED: { emoji: '😕', label: 'Frustrated', color: 'bg-sunny text-ink' },
  VERY_NEGATIVE: { emoji: '😤', label: 'Very Negative', color: 'bg-coral text-white' },
};

/**
 * Animated badge showing the detected sentiment and emotional state
 * of a message or chat session.
 */
export default function SentimentIndicator({ sentiment }) {
  if (!sentiment || !sentiment.label) return null;

  const data = EMOJI_MAP[sentiment.label] || EMOJI_MAP.NEUTRAL;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase border-2 border-ink rounded-full shadow-[2px_2px_0_#1A1A2E] ${data.color}`}
    >
      <motion.span
        animate={{ 
          rotate: ['0deg', '5deg', '-5deg', '0deg'], 
          y: [0, -1, 1, 0] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatType: 'reverse', 
          ease: 'easeInOut' 
        }}
        className="text-sm leading-none"
      >
        {data.emoji}
      </motion.span>
      <span className="tracking-wide font-mono text-[9px]">{data.label}</span>
    </motion.div>
  );
}
