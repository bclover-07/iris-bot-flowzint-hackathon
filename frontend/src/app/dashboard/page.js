'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import LiveRoutingFeed from '@/components/dashboard/LiveRoutingFeed';
import BudgetWarningBanner from '@/components/ui/BudgetWarningBanner';
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
  const { socket, routingEvents, isConnected } = useSocket(sessionId);
  const { budget: stats, fetchBudget: fetchStats } = useBudget(sessionId);

  const handleSend = async (text, options = {}) => {
    const { webSearch = false, socratic = false } = options;
    const newMessage = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const res = await api.post('/api/ai/chat', { message: text, sessionId, socraticMode: socratic, webSearchMode: webSearch });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        id: Date.now() + 1,
        tier: res.routing?.tier,
        model: res.routing?.modelDisplayName,
        routing: res.routing,
        cost: res.cost,
        injectionStatus: res.injectionStatus
      }]);
      fetchStats();
    } catch (err) {
      if (err.data?.injectionDetected) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I cannot answer that. Potential prompt injection detected and blocked by PIGuard.',
          id: Date.now() + 1,
          isBlocked: true,
          injectionStatus: 'blocked'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: err.message || 'An error occurred while connecting to IRIS.',
          id: Date.now() + 1,
          isError: true,
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full min-h-full pb-3 pr-2 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E] overflow-hidden relative z-10">
        {stats && (
          <BudgetWarningBanner mode={stats.mode} />
        )}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b-[3px] border-ink bg-cream shrink-0">
           <div className="flex items-center gap-2">
             <h2 className="font-black text-xs md:text-sm uppercase tracking-widest text-ink">IRIS Assistant</h2>
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

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
            <LiveRoutingFeed events={routingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
