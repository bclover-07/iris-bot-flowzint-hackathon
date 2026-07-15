'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RiShieldCheckLine, RiShieldKeyholeLine, RiBugLine, RiEyeLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

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
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 skeleton rounded-3xl neo-card"></div>
          <div className="h-32 skeleton rounded-3xl neo-card"></div>
          <div className="h-32 skeleton rounded-3xl neo-card"></div>
        </div>
        <div className="h-64 skeleton rounded-3xl neo-card"></div>
      </div>
    );
  }

  if (!data) return <div>Failed to load security analytics.</div>;

  const isShieldActive = data.summary.shieldStatus === 'active_blocking';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3 text-ink">
          Security Hub
          {isShieldActive ? (
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-mint text-ink border-[3px] border-ink text-sm flex items-center gap-2 rounded-full font-bold shadow-[3px_3px_0_#1A1A2E]"
            >
              <RiShieldCheckLine className="w-4 h-4" /> SHIELD ACTIVE
            </motion.span>
          ) : (
            <span className="px-3 py-1 bg-cream text-ink/70 border-[3px] border-ink/50 text-sm flex items-center gap-2 rounded-full font-bold">
              <RiEyeLine className="w-4 h-4" /> MONITORING
            </span>
          )}
        </h1>
        <p className="text-lg text-ink/70 font-medium">Monitoring PIGuard effectiveness against prompt injection attacks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-card card-coral p-6">
          <div className="flex items-center gap-3 text-coral mb-4">
            <div className="p-2 bg-coral/20 rounded-full border-2 border-coral">
              <RiShieldKeyholeLine className="w-6 h-6" />
            </div>
            <span className="text-sm uppercase font-black text-ink">Total Blocked Attacks</span>
          </div>
          <span className="text-5xl font-black text-ink">{data.summary.totalBlocked}</span>
        </div>
        
        <div className="neo-card card-sunny p-6">
          <div className="flex items-center gap-3 text-sunny mb-4">
            <div className="p-2 bg-sunny/20 rounded-full border-2 border-sunny text-ink">
              <RiBugLine className="w-6 h-6" />
            </div>
            <span className="text-sm uppercase font-black text-ink">Suspicious Prompts</span>
          </div>
          <span className="text-5xl font-black text-ink">{data.summary.totalSuspicious}</span>
        </div>

        <div className="neo-card card-mint p-6">
          <div className="flex items-center gap-3 text-mint mb-4">
            <div className="p-2 bg-mint/20 rounded-full border-2 border-mint text-ink">
              <RiShieldCheckLine className="w-6 h-6" />
            </div>
            <span className="text-sm uppercase font-black text-ink">Money Saved by Guard</span>
          </div>
          <span className="text-5xl font-black text-ink">${data.summary.savedBySecurity.toFixed(4)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="neo-card p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-ink/50 mb-4 border-b-[3px] border-ink/10 pb-3">Defense Layers</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-bold">Layer 1: Local Pre-filter</span>
                <span className="font-black text-coral">{data.layerBreakdown.local} blocked</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-bold">Layer 2: Otari PIGuard</span>
                <span className="font-black text-coral">{data.layerBreakdown.piguard} blocked</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-bold">Layer 3: Response Validator</span>
                <span className="font-black text-coral">{data.layerBreakdown.response} blocked</span>
              </div>
            </div>
          </div>
          
          <div className="neo-card p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-ink/50 mb-4 border-b-[3px] border-ink/10 pb-3">Attack Categories</h3>
            <div className="space-y-4 font-mono text-sm">
              {Object.entries(data.categoryBreakdown).length === 0 ? (
                <div className="text-ink/50 font-bold">No attacks recorded yet.</div>
              ) : (
                Object.entries(data.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-ink/80 font-bold truncate pr-3">{category}</span>
                    <span className="font-black bg-cream px-2 py-1 border-2 border-ink rounded-lg">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 neo-card p-6 flex flex-col h-[600px]">
          <h3 className="text-sm font-black uppercase tracking-widest text-ink/50 mb-6 border-b-[3px] border-ink/10 pb-3 shrink-0">Live Threat Log</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {data.recentEvents.length === 0 ? (
              <div className="text-ink/50 font-black text-sm text-center mt-10 border-[3px] border-dashed border-ink/20 p-8 rounded-2xl bg-cream">
                All systems clear. No security events recorded.
              </div>
            ) : (
              data.recentEvents.map((event, i) => (
                <div key={i} className={`p-4 border-[3px] border-ink rounded-xl font-mono text-sm ${event.threatLevel === 'blocked' ? 'bg-coral/10' : 'bg-sunny/10'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 font-black uppercase text-[10px] border-2 border-ink rounded-md shadow-[2px_2px_0_#1A1A2E] ${event.threatLevel === 'blocked' ? 'bg-coral text-white' : 'bg-sunny text-ink'}`}>
                        {event.threatLevel}
                      </span>
                      <span className="text-ink/60 font-bold text-xs">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="text-ink/50 font-black uppercase text-[10px] bg-white px-2 py-1 border-2 border-ink/20 rounded-md">Layer: {event.detectionLayer}</span>
                  </div>
                  <div className="bg-white p-3 border-[3px] border-ink rounded-lg text-ink/80 mb-3 truncate font-bold text-xs">
                    {event.promptSnippet}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.matchedPatterns.map((p, j) => (
                      <span key={j} className="text-[10px] bg-white border-2 border-ink rounded-full px-2 py-0.5 text-ink/70 font-bold">
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
