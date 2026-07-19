import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function RoutingChip({ routing, cost, costSavings, tokens }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (!routing) return null;

  const getTierBg = (name, tier) => {
    const str = `${name || ''} ${tier || ''}`;
    if (str.includes('Haiku') || str.includes('simple')) return 'bg-sunny';
    if (str.includes('Sonnet') || str.includes('complex')) return 'bg-coral';
    if (str.includes('Kimi') || str.includes('medium')) return 'bg-mint';
    if (str.includes('KB') || str.includes('RAG') || str.includes('cached')) return 'bg-sky';
    return 'bg-mint';
  };

  const bg = getTierBg(routing.modelDisplayName || routing.model, routing.tier);

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex flex-wrap items-center gap-3">
        <motion.div 
          onHoverStart={() => setShowAnalysis(true)}
          onHoverEnd={() => setShowAnalysis(false)}
          whileHover={{ scale: 1.05 }}
          className={`inline-flex items-center gap-2 px-4 py-2 border-[3px] border-ink ${bg} rounded-full shadow-[4px_4px_0_#1A1A2E] cursor-help`}
        >
          <span className="w-2 h-2 rounded-full bg-ink animate-pulse" />
          <span className="font-black text-xs uppercase tracking-widest text-ink">
            {routing.modelDisplayName || routing.tier}
          </span>
        </motion.div>
        
        {cost !== undefined && (
          <div className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-cream rounded-full shadow-[4px_4px_0_#1A1A2E]">
            <span className="font-mono font-bold text-xs text-ink/70">Cost:</span>
            <span className="font-mono font-bold text-xs ml-2 text-ink">
              ${Number(cost).toFixed(6)}
            </span>
          </div>
        )}

        {tokens && (tokens.input > 0 || tokens.output > 0) && (
          <div className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-[#E8F0FE] rounded-full shadow-[4px_4px_0_#1A1A2E]">
            <span className="font-mono font-black text-xs text-ink/75 uppercase tracking-wider">Tokens:</span>
            <span className="font-mono font-bold text-xs ml-2 text-ink">
              {tokens.input} In / {tokens.output} Out
            </span>
          </div>
        )}

        {costSavings && costSavings.savedPercent > 0 && (
          <motion.div 
            onHoverStart={() => setShowTooltip(true)}
            onHoverEnd={() => setShowTooltip(false)}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-mint/10 rounded-full shadow-[4px_4px_0_#1A1A2E] cursor-help relative"
          >
            <span className="font-mono font-bold text-xs text-mint">Saved vs Default:</span>
            <span className="font-mono font-black text-xs ml-2 text-mint">
              {costSavings.savedPercent}%
            </span>
            <span className="font-mono font-bold text-[10px] ml-2 text-ink/40">
              (-${Number(costSavings.saved).toFixed(4)})
            </span>

            <AnimatePresence>
              {showTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-ink text-white rounded-xl shadow-[4px_4px_0_var(--color-mint)] border-2 border-mint z-50 text-xs font-mono"
                >
                  <p>Worst-case: ${Number(costSavings.worstCaseCost).toFixed(4)}</p>
                  <p>Actual cost: ${Number(costSavings.actualCost).toFixed(4)}</p>
                  <p className="mt-1 text-mint font-bold">Total Saved: ${Number(costSavings.saved).toFixed(4)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {routing.analysisBreakdown && showAnalysis && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-2 bg-cream border-[3px] border-ink/10 rounded-xl p-3 overflow-hidden"
          >
            <p className="text-[10px] uppercase font-black tracking-widest text-ink/50 mb-2">Complexity Analysis (Score: {routing.score})</p>
            <div className="flex gap-2 flex-wrap text-[10px] font-bold">
              {Object.entries(routing.analysisBreakdown).map(([key, value]) => (
                <span key={key} className="bg-white border-2 border-ink px-2 py-1 rounded-md text-ink/80">{key}: {Number(value).toFixed(1)}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
