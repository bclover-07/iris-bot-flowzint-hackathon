export default function RoutingChip({ routing, cost }) {
  if (!routing || !routing.tier) return null;

  const tierColors = {
    'Haiku 4.5': 'bg-sunny',
    'Sonnet 4.6': 'bg-coral',
    'Kimi K2.6': 'bg-mint'
  };

  const bg = tierColors[routing.modelDisplayName] || 'bg-white';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className={`inline-flex items-center gap-2 px-4 py-2 border-[3px] border-ink ${bg} rounded-full shadow-[4px_4px_0_#1A1A2E]`}>
        <span className="w-2 h-2 rounded-full bg-ink animate-pulse" />
        <span className="font-black text-xs uppercase tracking-widest text-ink">
          {routing.modelDisplayName || routing.tier}
        </span>
      </div>
      
      {cost > 0 && (
        <div className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-cream rounded-full shadow-[4px_4px_0_#1A1A2E]">
          <span className="font-mono font-bold text-xs text-ink/70">Cost:</span>
          <span className="font-mono font-bold text-xs ml-2 text-ink">
            ${Number(cost).toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
