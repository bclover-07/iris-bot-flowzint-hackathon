export default function RoutingChip({ routing, cost, costSavings }) {
  if (!routing || !routing.tier) return null;

  const tierColors = {
    'Haiku 4.5': 'bg-sunny',
    'Sonnet 4.6': 'bg-coral',
    'Kimi K2.6': 'bg-mint',
    'Local KB': 'bg-sky'
  };

  const bg = tierColors[routing.modelDisplayName] || 'bg-white';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className={`inline-flex items-center gap-2 px-4 py-2 border-[3px] border-ink ${bg} rounded-full shadow-[4px_4px_0_#1A1A2E]`}>
          <span className="w-2 h-2 rounded-full bg-ink animate-pulse" />
          <span className="font-black text-xs uppercase tracking-widest text-ink">
            {routing.modelDisplayName || routing.tier}
          </span>
        </div>
        
        {cost !== undefined && (
          <div className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-cream rounded-full shadow-[4px_4px_0_#1A1A2E]">
            <span className="font-mono font-bold text-xs text-ink/70">Cost:</span>
            <span className="font-mono font-bold text-xs ml-2 text-ink">
              ${Number(cost).toFixed(6)}
            </span>
          </div>
        )}

        {costSavings && costSavings.savedPercent > 0 && (
          <div className="inline-flex items-center px-4 py-2 border-[3px] border-ink bg-mint/10 rounded-full shadow-[4px_4px_0_#1A1A2E]">
            <span className="font-mono font-bold text-xs text-mint">Saved vs Default:</span>
            <span className="font-mono font-black text-xs ml-2 text-mint">
              {costSavings.savedPercent}%
            </span>
            <span className="font-mono font-bold text-[10px] ml-2 text-ink/40">
              (-${Number(costSavings.saved).toFixed(4)})
            </span>
          </div>
        )}
      </div>

      {routing.analysisBreakdown && (
        <div className="w-full mt-2 bg-cream border-[3px] border-ink/10 rounded-xl p-3">
          <p className="text-[10px] uppercase font-black tracking-widest text-ink/50 mb-2">Complexity Analysis (Score: {routing.score})</p>
          <div className="flex gap-2 flex-wrap text-[10px] font-bold">
            {Object.entries(routing.analysisBreakdown).map(([key, value]) => (
              <span key={key} className="bg-white border-2 border-ink px-2 py-1 rounded-md text-ink/80">{key}: {Number(value).toFixed(1)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
