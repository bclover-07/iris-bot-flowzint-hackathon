'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import LiveRoutingFeed from '@/components/dashboard/LiveRoutingFeed';
import BudgetWarningBanner from '@/components/ui/BudgetWarningBanner';
import AgentThinkingGraph from '@/components/ui/AgentThinkingGraph';
import { useSocket } from '@/hooks/useSocket';
import { useBudget } from '@/hooks/useBudget';

import { useDashboard } from '@/context/DashboardContext';

export default function DashboardPage() {
  const {
    messages,
    isLoading,
    historyLoaded,
    isConnected,
    routingEvents,
    stats,
    handleSend,
    handleGenerateSummary,
  } = useDashboard();

  const latestStepEvent = routingEvents.find(e => e.type === 'routing_step');
  const currentStep = latestStepEvent ? latestStepEvent.step : 0;
  const graphStatus = latestStepEvent ? latestStepEvent.status : 'idle';
  const graphLogs = routingEvents
    .filter(e => e.type === 'routing_step' && e.message)
    .map(e => e.message);

  return (
    <div className="h-full min-h-full pb-3 pr-2 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E] overflow-hidden relative z-10">
        {stats && (
          <BudgetWarningBanner mode={stats.mode} />
        )}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b-[3px] border-ink bg-cream shrink-0">
           <div className="flex items-center gap-2">
             <h2 className="font-black text-xs md:text-sm uppercase tracking-widest text-ink">IRIS Bot Assistant</h2>
           </div>
           {messages.length > 0 && (
             <button 
               onClick={handleGenerateSummary}
               disabled={isLoading}
               className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 bg-sunny border-2 border-ink rounded-full shadow-[2px_2px_0_#1A1A2E] hover:translate-y-px hover:shadow-[1px_1px_0_#1A1A2E] transition-all disabled:opacity-50"
             >
               Recap Session
             </button>
           )}
         </div>
         <ChatWindow messages={messages} isLoading={isLoading} historyLoaded={historyLoaded} />
        <ChatInput 
          onSend={handleSend} 
          disabled={!isConnected || isLoading} 
          isLoading={isLoading}
          budgetExceeded={stats?.mode === 'exceeded'} 
        />
      </div>

      {/* Routing Feed Sidebar */}
      <div className="w-full lg:w-[320px] shrink-0 z-10 h-[300px] lg:h-auto">
        <div className="bg-white border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E] p-4 md:p-5 h-full flex flex-col relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b-[3px] border-ink shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 font-bold text-[10px] uppercase border-[2px] border-ink bg-sky text-ink rounded-full shadow-[2px_2px_0_#1A1A2E]">Live</span>
              <h3 className="font-black text-xs uppercase tracking-[0.15em] text-ink">Routing Feed</h3>
            </div>
            <motion.div 
              className={`w-3 h-3 rounded-full border-[2px] border-ink shadow-[2px_2px_0_#1A1A2E] ${isConnected ? 'bg-mint' : 'bg-coral'}`}
              animate={isConnected ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <div className="mb-4 shrink-0">
            <AgentThinkingGraph events={routingEvents} currentStep={currentStep} status={graphStatus} logs={graphLogs} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
            <LiveRoutingFeed events={routingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
