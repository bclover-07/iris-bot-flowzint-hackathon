'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getApiUrl } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useBudget } from '@/hooks/useBudget';

const DashboardContext = createContext(null);

export function useDashboard() {
  return useContext(DashboardContext);
}

export function DashboardProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const sessionId = user?._id || user?.id
    ? `${user._id || user.id}-dashboard`
    : 'demo-session-id-dashboard';

  const { socket, routingEvents, isConnected, clearEvents } = useSocket(sessionId);
  const { budget: stats, fetchBudget: fetchStats } = useBudget(sessionId);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(data => {
        setUser(data.user);
        const sid = data.user?._id || data.user?.id;
        if (sid) {
          return api.get(`/api/ai/history/${sid}-dashboard`)
            .then(res => {
              if (res.messages && res.messages.length > 0) {
                setMessages(res.messages);
              }
            })
            .catch(err => console.error('Failed to load history:', err));
        }
      })
      .catch(err => console.warn('Auth check error:', err.message))
      .finally(() => {
        setHistoryLoaded(true);
        setUserLoading(false);
      });
  }, []);

  const handleSend = useCallback(async (text, options = {}) => {
    const { webSearch = false, socratic = false } = options;

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
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ message: text, sessionId, socraticMode: socratic, webSearchMode: webSearch })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedAnswer = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;
        const lines = buffer.split('\n');
        buffer = lines.pop();

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
                  tokens: data.tokens,
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
      console.warn('[DashboardContext] Stream fetch failed, executing fallback POST /api/ai/chat...', err.message);
      try {
        const fallbackData = await api.post('/api/ai/chat', {
          message: text,
          sessionId,
          socraticMode: socratic,
          webSearchMode: webSearch
        });

        if (fallbackData && fallbackData.answer) {
          setMessages(prev => prev.map(m => m.id === tempId ? {
            ...m,
            content: fallbackData.answer,
            isStreaming: false,
            tier: fallbackData.routing?.tier,
            model: fallbackData.routing?.modelDisplayName || fallbackData.routing?.model,
            routing: fallbackData.routing,
            cost: fallbackData.cost,
            costSavings: fallbackData.costSavings,
            tokens: fallbackData.tokens,
            injectionStatus: fallbackData.injectionStatus,
            sentiment: fallbackData.sentiment
          } : m));
          fetchStats();
          return;
        }
      } catch (fallbackErr) {
        console.error('[DashboardContext] POST fallback also failed:', fallbackErr.message);
      }

      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        content: err.message || 'An error occurred while connecting to IRIS Bot.',
        isError: true,
        isStreaming: false
      } : m));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, clearEvents, fetchStats]);

  const handleGenerateSummary = useCallback(async () => {
    if (messages.length === 0) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/api/ai/summary/${sessionId}`);
      const recapMessage = {
        role: 'assistant',
        content: data.summary || "No active history to summarize.",
        id: Date.now(),
        routing: {
          modelDisplayName: 'System Mentor',
          tier: 'cached',
          reason: 'Study session recap generated locally using Kimi K2.6.'
        }
      };
      setMessages(prev => [...prev, recapMessage]);
    } catch (err) {
      console.error('Failed to generate study recap:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId]);

  const value = {
    user,
    userLoading,
    messages,
    setMessages,
    isLoading,
    historyLoaded,
    sessionId,
    socket,
    routingEvents,
    isConnected,
    clearEvents,
    stats,
    fetchStats,
    handleSend,
    handleGenerateSummary,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
