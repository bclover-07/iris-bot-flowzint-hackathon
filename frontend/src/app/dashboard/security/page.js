'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RiShieldCheckLine, RiShieldKeyholeLine, RiBugLine, RiEyeLine } from 'react-icons/ri';

export default function SecurityDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/analytics/security')
      .then(setData)
      .catch(err => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse p-6 bg-brutal-card h-full border-2 border-brutal-border">Loading Security Hub...</div>;
  }

  if (!data) return <div>Failed to load security analytics.</div>;

  const isShieldActive = data.summary.shieldStatus === 'active_blocking';

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2 flex items-center gap-3">
          Security Hub
          {isShieldActive ? (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500 text-xs flex items-center gap-1">
              <RiShieldCheckLine /> SHIELD ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500 text-xs flex items-center gap-1">
              <RiEyeLine /> MONITORING
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 font-mono">Monitoring PIGuard effectiveness against prompt injection attacks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brutal-card border-2 border-brutal-border p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <RiShieldKeyholeLine className="w-5 h-5" />
            <span className="text-xs uppercase font-bold">Total Blocked Attacks</span>
          </div>
          <span className="text-4xl font-black text-red-500">{data.summary.totalBlocked}</span>
        </div>
        
        <div className="bg-brutal-card border-2 border-brutal-border p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <RiBugLine className="w-5 h-5" />
            <span className="text-xs uppercase font-bold">Suspicious Prompts</span>
          </div>
          <span className="text-4xl font-black text-yellow-500">{data.summary.totalSuspicious}</span>
        </div>

        <div className="bg-brutal-card border-2 border-brutal-border p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <RiShieldCheckLine className="w-5 h-5" />
            <span className="text-xs uppercase font-bold">Money Saved by Guard</span>
          </div>
          <span className="text-4xl font-black text-emerald-500">${data.summary.savedBySecurity.toFixed(4)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-brutal-card border-2 border-brutal-border p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-brutal-border pb-2">Defense Layers</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Layer 1: Local Pre-filter</span>
                <span className="font-bold">{data.layerBreakdown.local} blocked</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Layer 2: Otari PIGuard</span>
                <span className="font-bold">{data.layerBreakdown.piguard} blocked</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Layer 3: Response Validator</span>
                <span className="font-bold">{data.layerBreakdown.response} blocked</span>
              </div>
            </div>
          </div>
          
          <div className="bg-brutal-card border-2 border-brutal-border p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-brutal-border pb-2">Attack Categories</h3>
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(data.categoryBreakdown).length === 0 ? (
                <div className="text-gray-500">No attacks recorded yet.</div>
              ) : (
                Object.entries(data.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-gray-300 truncate pr-2">{category}</span>
                    <span className="font-bold shrink-0">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brutal-card border-2 border-brutal-border p-4 flex flex-col h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-brutal-border pb-2 shrink-0">Live Threat Log</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {data.recentEvents.length === 0 ? (
              <div className="text-gray-500 font-mono text-xs text-center mt-10 border-2 border-dashed border-brutal-border p-6">
                All systems clear. No security events recorded.
              </div>
            ) : (
              data.recentEvents.map((event, i) => (
                <div key={i} className={`p-3 border text-xs font-mono ${event.threatLevel === 'blocked' ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 font-bold uppercase text-[9px] ${event.threatLevel === 'blocked' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                        {event.threatLevel}
                      </span>
                      <span className="text-gray-400">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="text-gray-500 uppercase text-[9px]">Layer: {event.detectionLayer}</span>
                  </div>
                  <div className="bg-brutal-black p-2 border border-black text-gray-300 mb-2 truncate">
                    {event.promptSnippet}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {event.matchedPatterns.map((p, j) => (
                      <span key={j} className="text-[9px] bg-brutal-black border border-brutal-border px-1 text-gray-400">
                        {p.label} ({(p.severity * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
