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

export default function DashboardPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  const [user, setUser] = useState(null);
  
  // Load state from DB on mount
  useEffect(() => {
    api.get('/api/auth/me').then(data => {
      setUser(data.user);
      const sid = data.user?._id || data.user?.id;
      if (sid) {
        api.get(`/api/ai/history/${sid}`)
          .then(res => {
            if (res.messages && res.messages.length > 0) {
              setMessages(res.messages);
            }
          })
          .catch(err => console.error('Failed to load history:', err));
      }
    }).catch(() => {});
  }, []);

  // Personalized session for budget/routing isolation
  const sessionId = user?._id || user?.id || 'demo-session-id';
  const { socket, routingEvents, isConnected, clearEvents } = useSocket(sessionId);
  const { budget: stats, fetchBudget: fetchStats } = useBudget(sessionId);

  const handleSend = async (text, options = {}) => {
    const { webSearch = false, socratic = false } = options;
    
    // Clear stale routing events for new query
    if (clearEvents) clearEvents();

    const newMessage = { role: 'user', content: text, id: Date.now() };
    const tempId = Date.now() + 1;
    setMessages(prev => [...prev, newMessage, {
      role: 'assistant',
      content: '',
      id: tempId,
      isStreaming: true,
    }]);
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: text, sessionId, socraticMode: socratic, webSearchMode: webSearch })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to IRIS Bot stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedAnswer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            try {
              const data = JSON.parse(dataStr);

              if (data.error) {
                setMessages(prev => prev.map(m => m.id === tempId ? {
                  ...m,
                  content: data.message || 'An error occurred.',
                  isError: true,
                  isStreaming: false,
                  injectionStatus: data.injectionStatus || 'clean'
                } : m));
                setIsLoading(false);
                return;
              }

              if (data.chunk) {
                accumulatedAnswer += data.chunk;
                setMessages(prev => prev.map(m => m.id === tempId ? {
                  ...m,
                  content: accumulatedAnswer,
                } : m));
              }

              if (data.done) {
                setMessages(prev => prev.map(m => m.id === tempId ? {
                  ...m,
                  content: data.answer || accumulatedAnswer,
                  isStreaming: false,
                  tier: data.routing?.tier,
                  model: data.routing?.modelDisplayName,
                  routing: data.routing,
                  cost: data.cost,
                  costSavings: data.costSavings,
                  injectionStatus: data.injectionStatus
                } : m));
                fetchStats();
              }
            } catch (e) {
              console.error('Failed to parse SSE data', e);
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        content: err.message || 'An error occurred while connecting to IRIS Bot.',
        isError: true,
        isStreaming: false
      } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const latestStepEvent = routingEvents.find(e => e.type === 'routing_step');
  const currentStep = latestStepEvent ? latestStepEvent.step : 0;
  const graphStatus = latestStepEvent ? latestStepEvent.status : 'idle';
  const graphLogs = routingEvents
    .filter(e => e.type === 'routing_step' && e.message)
    .map(e => e.message)
    .reverse();

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
         </div>
         <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput 
          onSend={handleSend} 
          disabled={!isConnected} 
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
            <AgentThinkingGraph currentStep={currentStep} status={graphStatus} logs={graphLogs} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
            <LiveRoutingFeed events={routingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
