'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { RiTimeLine, RiRouteLine, RiShieldLine, RiCoinLine, RiBrainLine, RiErrorWarningLine } from 'react-icons/ri';
import { TIER_COLORS } from '@/lib/constants';

const getTierColor = (tier) => {
  if (tier === 'Haiku 4.5') return 'bg-sunny';
  if (tier === 'Sonnet 4.6') return 'bg-coral';
  return 'bg-mint'; // Kimi K2.6
};

export default function LiveRoutingFeed({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink/40 space-y-4">
        <div className="w-16 h-16 border-[4px] border-dashed border-ink/20 rounded-full flex items-center justify-center">
          <RiTimeLine className="w-8 h-8" />
        </div>
        <p className="font-bold text-sm uppercase tracking-widest text-center">Waiting for queries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <AnimatePresence initial={false}>
        {events.map((event, i) => {
          const isBlocked = event.type === 'injection_blocked';
          const tierStyle = TIER_COLORS[event.tier] || TIER_COLORS.simple;

          if (isBlocked) {
            return (
              <motion.div
                key={event.id || i}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-4 bg-coral/10 border-[3px] border-coral rounded-2xl shadow-[4px_4px_0_#FF6B6B] relative overflow-hidden"
              >
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black uppercase text-coral tracking-widest flex items-center gap-2">
                      <RiShieldLine className="w-4 h-4" /> PIGuard Blocked
                    </span>
                    <span className="text-coral font-bold text-[10px]">Cost: $0.00</span>
                  </div>
                  <h4 className="font-bold text-ink/70 text-sm mb-2 break-words truncate">&quot;{event.message || event.promptExcerpt}&quot;</h4>
                </div>
              </motion.div>
            );
          }

          if (event.type === 'routing_step') {
            const getIcon = () => {
              if (event.step === 1) return <RiTimeLine className="w-4 h-4" />;
              if (event.step === 2) return <RiBrainLine className="w-4 h-4" />;
              if (event.step === 3) return <RiRouteLine className="w-4 h-4" />;
              if (event.step === 4) return <RiBrainLine className="w-4 h-4" />;
              if (event.step === 5) return <RiTimeLine className="w-4 h-4 animate-spin" />;
              if (event.step === 6) return <RiShieldLine className="w-4 h-4" />;
              return <RiTimeLine className="w-4 h-4" />;
            };
            
            return (
              <motion.div
                key={event.id || `step-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-6 py-2"
              >
                {/* Pipeline connector line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-ink/20" />
                {/* Status Dot */}
                <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cream border-2 border-ink flex items-center justify-center text-ink z-10 shadow-[2px_2px_0_#1A1A2E]">
                  {event.status === 'done' ? <div className="w-2 h-2 bg-mint rounded-full" /> : <div className="w-1.5 h-1.5 bg-sunny rounded-full animate-pulse" />}
                </div>
                
                <div className="bg-white border-2 border-ink rounded-lg p-2 shadow-[2px_2px_0_#1A1A2E] flex items-center gap-2">
                  <span className="text-ink/60">{getIcon()}</span>
                  <span className="text-xs font-bold text-ink">{event.message}</span>
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={event.id || `card-${i}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`p-4 bg-white border-[3px] border-ink rounded-2xl shadow-[4px_4px_0_#1A1A2E] relative overflow-hidden mt-2`}
            >
              {/* Colored side accent (rounded) */}
              <div className={`absolute left-0 top-0 bottom-0 w-3 border-r-[3px] border-ink ${getTierColor(event.modelDisplayName || event.tier)}`} />
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase text-ink/50 tracking-widest">
                    {event.timestamp ? (() => { const d = new Date(event.timestamp); return isNaN(d.getTime()) ? 'Just now' : d.toLocaleTimeString(); })() : 'Just now'}
                  </span>
                  <span className="font-mono font-bold text-[10px] bg-cream border-[2px] border-ink px-2 py-0.5 rounded-full text-ink">
                    ${Number(event.cost?.thisCallFormatted?.replace('$', '') || event.cost || 0).toFixed(4)}
                  </span>
                </div>
                
                <h4 className="font-bold text-ink text-sm mb-2 break-words">&quot;{event.promptExcerpt || 'Processed Query'}&quot;</h4>
                
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-[2px] border-ink/10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-[2px] border-ink rounded-full flex items-center gap-1 ${getTierColor(event.modelDisplayName || event.tier)}`}>
                    <RiBrainLine className="w-3 h-3" /> {event.modelDisplayName || event.tier}
                  </span>
                  <span className="text-[10px] font-bold text-ink/70 px-2 py-1 bg-cream border-[2px] border-transparent rounded-full flex-1 truncate" title={event.reason}>
                    {event.reason}
                  </span>
                </div>
                
                {event.costSavings?.savedPercent > 0 && (
                  <div className="mt-2 text-[10px] font-bold text-mint bg-mint/10 border-2 border-mint px-2 py-1 rounded-full w-fit">
                    Saved {event.costSavings.savedPercent}% vs Sonnet 4.6
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
