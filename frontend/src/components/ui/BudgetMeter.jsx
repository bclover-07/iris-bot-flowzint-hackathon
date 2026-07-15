'use client';
import { RiWallet3Line } from 'react-icons/ri';
import { motion } from 'framer-motion';

export default function BudgetMeter({ budget }) {
  if (!budget) return null;
  
  // Use a credit-based approach: remaining vs total
  const { spent = 0, remaining = 2, total = 2, mode = 'normal' } = budget;
  
  // Percentage of remaining credits
  const percentage = Math.max((remaining / total) * 100, 0);
  
  let statusColor = 'bg-mint';
  let dotColor = 'bg-mint';
  if (mode === 'warning' || mode === 'caution') { statusColor = 'bg-sunny'; dotColor = 'bg-sunny'; }
  if (mode === 'exceeded' || mode === 'critical') { statusColor = 'bg-coral'; dotColor = 'bg-coral'; }

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Animated status dot */}
      <div className={`w-3 h-3 rounded-full ${dotColor} border-2 border-ink shrink-0 ${mode !== 'normal' ? 'animate-pulse' : ''}`} />
      
      {/* Progress bar */}
      <div className="flex-1 h-3 bg-white border-[3px] border-ink rounded-full overflow-hidden relative min-w-[60px]">
        <motion.div 
          className={`h-full ${statusColor} rounded-full`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
      </div>
      
      {/* Cost text */}
      <span className="font-mono font-bold text-xs text-ink whitespace-nowrap shrink-0">
        ${remaining.toFixed(4)}<span className="text-ink/40">/${total.toFixed(2)}</span>
      </span>
    </div>
  );
}
