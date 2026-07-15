'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export function useBudget(sessionId) {
  const [budget, setBudget] = useState({
    spent: 0,
    remaining: 2.00,
    total: 2.00,
    percentUsed: 0,
    mode: 'normal',
    calls: 0,
    blockedCalls: 0,
    history: [],
  });
  const intervalRef = useRef(null);

  const fetchBudget = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.get(`/api/budget/stats/${sessionId}`);
      setBudget(data);
    } catch {
      /* silently fail */
    }
  }, [sessionId]);

  const updateFromResponse = useCallback((costData) => {
    if (costData) {
      setBudget(prev => ({
        ...prev,
        spent: costData.spent ?? prev.spent,
        remaining: costData.remaining ?? prev.remaining,
        percentUsed: costData.percentUsed ?? prev.percentUsed,
        mode: costData.mode ?? prev.mode,
        calls: prev.calls + 1,
      }));
    }
  }, []);

  const resetBudget = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.post(`/api/budget/reset/${sessionId}`);
      setBudget(data.stats);
    } catch {
      /* silently fail */
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBudget();
    intervalRef.current = setInterval(fetchBudget, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchBudget]);

  return { budget, fetchBudget, updateFromResponse, resetBudget };
}
