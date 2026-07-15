'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { RiMoneyDollarCircleLine as RiMoney, RiBrainLine as RiBrain, RiRouteLine as RiRoute, RiLineChartLine as RiLineChart, RiEyeLine } from 'react-icons/ri';
import JourneyModal from '@/components/dashboard/JourneyModal';
import AllHistoryModal from '@/components/dashboard/AllHistoryModal';
import { TIER_COLORS } from '@/lib/constants';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    api.get('/api/analytics/overview')
      .then(setData)
      .catch(err => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse p-6 bg-brutal-card h-full border-2 border-brutal-border">Loading Analytics...</div>;
  }

  if (!data) return <div>Failed to load analytics.</div>;

  const modelData = Object.entries(data.modelDistribution).map(([name, value]) => ({ name: name.split('/')[1] || name, value }));
  const complexityData = [
    { name: 'Simple', value: data.complexityBuckets.simple },
    { name: 'Medium', value: data.complexityBuckets.medium },
    { name: 'Complex', value: data.complexityBuckets.complex },
  ].filter(d => d.value > 0);

  const sentimentScoreMap = {
    VERY_POSITIVE: 4,
    POSITIVE: 3,
    NEUTRAL: 2,
    SLIGHTLY_NEGATIVE: 2,
    FRUSTRATED: 1,
    VERY_NEGATIVE: 0,
  };

  let cumulativeSaved = 0;
  const historyChartData = [...data.recentHistory].reverse().map((h, i) => {
    cumulativeSaved += (h.costSavings?.saved || 0);
    const scoreVal = h.sentiment && h.sentiment.label ? sentimentScoreMap[h.sentiment.label] : 2;
    return {
      name: `Q${i + 1}`,
      cost: h.cost,
      saved: h.costSavings?.saved || 0,
      cumulativeSaved: parseFloat(cumulativeSaved.toFixed(5)),
      sentimentVal: scoreVal,
      sentimentLabel: h.sentiment ? h.sentiment.label : 'NEUTRAL',
    };
  });

  const avgCostPerQuery = data.summary.totalCalls > 0 ? data.summary.totalCost / data.summary.totalCalls : 0;
  const remainingQueries = avgCostPerQuery > 0 ? Math.floor(data.budget.remaining / avgCostPerQuery) : '∞';


  return (
    <div className="space-y-6 animate-slide-up pr-2 custom-scrollbar">
      <div className="inline-flex items-center gap-3 bg-mint border-[4px] border-ink px-5 py-2.5 shadow-[6px_6px_0_#1A1A2E] rounded-2xl mb-2 -rotate-1 hover:rotate-0 transition-transform cursor-default">
        <span className="text-2xl">📊</span>
        <h1 className="text-2xl md:text-3xl font-black text-ink uppercase tracking-tight">Usage & Analytics</h1>
      </div>
      <p className="text-ink font-bold text-base md:text-lg opacity-80 ml-1 mb-6">Real-time insights into your AI budget and routing efficiency.</p>

      {/* Budget Forecast Widget */}
      <div className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 inline-block">Budget Forecast</h3>
          <span className={`px-3 py-1 font-black text-xs uppercase border-2 border-ink rounded-lg shadow-[2px_2px_0_#1A1A2E] ${data.budget.mode === 'degraded' ? 'bg-coral text-white' : 'bg-mint text-ink'}`}>
            {data.budget.mode === 'degraded' ? 'DEGRADED MODE' : 'NORMAL MODE'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-black text-ink/60">Budget Remaining</span>
            <span className="text-4xl font-black text-ink">${data.budget.remaining.toFixed(3)}</span>
            <span className="text-xs font-bold text-ink/70">out of ${data.budget.total.toFixed(2)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-black text-ink/60">Avg Cost / Query</span>
            <span className="text-4xl font-black text-ink">${avgCostPerQuery.toFixed(4)}</span>
            <span className="text-xs font-bold text-ink/70">across {data.summary.totalCalls} queries</span>
          </div>

          <div className="flex flex-col gap-1 bg-cream border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0_#1A1A2E]">
            <span className="text-xs uppercase font-black text-ink/60">Est. Remaining Queries</span>
            <span className="text-4xl font-black text-coral">{remainingQueries}</span>
            <span className="text-xs font-bold text-ink/70">at current burn rate</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-ink mb-2">
            <span>Spent: ${data.budget.spent.toFixed(3)}</span>
            <span>{data.budget.percentUsed.toFixed(1)}% Used</span>
          </div>
          <div className="w-full h-6 bg-cream border-[3px] border-ink rounded-full overflow-hidden flex shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
            <div 
              className={`h-full border-r-[3px] border-ink transition-all duration-1000 ${data.budget.percentUsed > 80 ? 'bg-coral' : 'bg-mint'}`} 
              style={{ width: `${Math.min(100, data.budget.percentUsed)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setShowAllHistory(true)}
          className="bg-white border-[4px] border-ink shadow-[4px_4px_0_#1A1A2E] rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:-translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_#1A1A2E] transition-all group"
        >
          <div className="flex items-center gap-2 text-ink/70 z-10">
            <RiRoute className="w-5 h-5 text-ink group-hover:scale-110 transition-transform" />
            <span className="text-xs uppercase font-black tracking-widest text-ink">Total Queries</span>
          </div>
          <span className="text-4xl font-black text-ink z-10 mt-2">{data.summary.totalCalls}</span>
        </div>
        
        <div className="bg-sunny border-[4px] border-ink shadow-[4px_4px_0_#1A1A2E] rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-ink/70 z-10">
            <RiMoney className="w-5 h-5 text-ink" />
            <span className="text-xs uppercase font-black tracking-widest text-ink">Actual Cost</span>
          </div>
          <span className="text-4xl font-black text-ink z-10 mt-2">${data.summary.totalCost.toFixed(4)}</span>
        </div>

        <div className="bg-mint border-[4px] border-ink shadow-[4px_4px_0_#1A1A2E] rounded-2xl p-5 flex flex-col gap-2 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-2 z-10">
            <RiLineChart className="w-5 h-5 text-ink" />
            <span className="text-xs uppercase font-black tracking-widest text-ink">IRIS Bot Saved You</span>
          </div>
          <div className="flex items-end gap-3 z-10 mt-1">
            <span className="text-4xl font-black text-ink">${data.summary.savedCost.toFixed(4)}</span>
            <span className="text-sm font-black text-white bg-ink px-3 py-1 rounded-full mb-1 border-2 border-white shadow-[2px_2px_0_#1A1A2E]">
              {data.summary.savingsPercent}% savings
            </span>
          </div>
          <p className="text-xs font-bold text-ink/80 mt-2 z-10">Compared to routing all queries to Claude Sonnet 4.6</p>
          <RiMoney className="absolute -right-6 -bottom-10 w-40 h-40 text-white/20 rotate-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost over time */}
        <div className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 mb-6 inline-block">Cost Per Query Timeline</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="name" stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '3px solid #0f172a', borderRadius: '12px', boxShadow: '4px 4px 0 #1A1A2E' }}
                  itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="cost" stroke="#0f172a" strokeWidth={4} dot={{ r: 5, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 3 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6 flex flex-col">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 mb-6 inline-block">Model Distribution</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {modelData.length > 0 ? (
              <div className="w-full h-64 relative flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="#0f172a"
                      strokeWidth={3}
                    >
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '3px solid #0f172a', borderRadius: '12px', boxShadow: '4px 4px 0 #1A1A2E' }}
                      itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                  {modelData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3 text-sm bg-cream border-[3px] border-ink shadow-[2px_2px_0_#1A1A2E] px-3 py-1.5 rounded-xl">
                      <div className="w-3 h-3 rounded-full border-2 border-ink" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-bold text-ink">{entry.name}</span>
                      <span className="font-black text-ink ml-2 bg-white px-2 py-0.5 rounded-lg border-2 border-ink">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-ink/60 font-bold text-lg border-[3px] border-dashed border-ink/40 rounded-2xl p-8">No model data yet. Start making queries!</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Cumulative Savings Timeline */}
        <div className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 mb-6 inline-block">Cumulative Cost Savings Timeline</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="name" stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '3px solid #0f172a', borderRadius: '12px', boxShadow: '4px 4px 0 #1A1A2E' }}
                  itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="cumulativeSaved" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 3 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Satisfaction / Sentiment Timeline */}
        <div className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 mb-6 inline-block">Student Sentiment & Satisfaction</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="name" stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#0f172a" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => {
                  const labels = ['😤 Angry', '😕 Sad', '😐 Neutral', '🙂 Happy', '😊 Superb'];
                  return labels[v] || '';
                }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '3px solid #0f172a', borderRadius: '12px', boxShadow: '4px 4px 0 #1A1A2E' }}
                  itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="sentimentVal" stroke="#ec4899" strokeWidth={4} dot={{ r: 5, fill: '#ec4899', stroke: '#0f172a', strokeWidth: 3 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Queries for Deep Analysis */}
      <div id="history-section" className="bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-3xl p-6 mt-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-ink border-b-4 border-ink pb-2 mb-6 inline-block">Deep Analysis: Recent Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recentHistory.length > 0 ? (
            data.recentHistory.slice(0, 6).map((query, i) => (
              <div 
                key={query.id || i} 
                onClick={() => setSelectedQuery(query)}
                className="group cursor-pointer bg-cream border-[3px] border-ink rounded-2xl p-4 shadow-[4px_4px_0_#1A1A2E] hover:shadow-[2px_2px_0_#1A1A2E] hover:translate-y-1 hover:translate-x-1 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 border-ink rounded-full ${TIER_COLORS[query.tier] || 'bg-white'}`}>
                    {query.model?.split('/')[1] || query.model || 'Unknown'}
                  </span>
                  <RiEyeLine className="w-5 h-5 text-ink/40 group-hover:text-ink transition-colors" />
                </div>
                <p className="font-bold text-ink text-sm line-clamp-2 mb-3">&quot;{query.query || 'View details...'}&quot;</p>
                <div className="flex justify-between items-center text-xs font-bold text-ink/60 border-t-2 border-ink/10 pt-2">
                  <span>{new Date(query.timestamp).toLocaleTimeString()}</span>
                  <span className="bg-white px-2 py-0.5 rounded border-2 border-ink text-ink font-black">${Number(query.cost || 0).toFixed(4)}</span>
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full text-center text-ink/60 font-bold text-lg border-[3px] border-dashed border-ink/40 rounded-2xl p-8">No queries found for analysis.</div>
          )}
        </div>
      </div>

      {/* All History Modal */}
      {showAllHistory && (
        <AllHistoryModal 
          history={data.recentHistory} 
          onClose={() => setShowAllHistory(false)} 
          onSelectQuery={(query) => {
            setSelectedQuery(query);
            setShowAllHistory(false);
          }}
        />
      )}

      {/* Journey Modal */}
      {selectedQuery && (
        <JourneyModal queryData={selectedQuery} onClose={() => setSelectedQuery(null)} />
      )}
    </div>
  );
}
