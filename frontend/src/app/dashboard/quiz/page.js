'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import QuizUpload from '@/components/quiz/QuizUpload';
import QuizCard from '@/components/quiz/QuizCard';
import QuizResults from '@/components/quiz/QuizResults';
import LiveRoutingFeed from '@/components/dashboard/LiveRoutingFeed';
import { useSocket } from '@/hooks/useSocket';
import { useBudget } from '@/hooks/useBudget';

export default function QuizPage() {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const sessionId = 'demo-session-id';
  const { routingEvents, isConnected } = useSocket(sessionId);
  const { budget: stats, fetchBudget: fetchStats } = useBudget(sessionId);

  const handleGenerate = async (params) => {
    setLoading(true);
    setError('');
    setQuiz(null);
    setResults(null);
    try {
      const res = await api.post('/api/quiz/generate', { ...params, sessionId });
      setQuiz({ id: res.attemptId, questions: res.questions });
      fetchStats();
    } catch (err) {
      if (err.data?.injectionDetected) {
        setError('PIGuard blocked generation: Potential prompt injection detected.');
      } else {
        setError(err.message || 'Failed to generate quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answers) => {
    setLoading(true);
    try {
      const res = await api.post('/api/quiz/submit', { attemptId: quiz.id, answers });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      <div className="flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
        {/* Page Title */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="inline-flex items-center gap-3 bg-sunny border-[4px] border-ink px-5 py-2.5 shadow-[6px_6px_0_#1A1A2E] rounded-2xl mb-4 -rotate-1 hover:rotate-0 transition-transform cursor-default">
            <span className="text-2xl">📚</span>
            <h1 className="text-2xl md:text-3xl font-black text-ink uppercase tracking-tight">Quiz Forge</h1>
          </div>
          <p className="text-ink font-bold text-base md:text-lg opacity-80 ml-1">Generate custom quizzes from topics or your own notes.</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-coral/20 border-[4px] border-coral rounded-2xl text-coral font-bold flex items-center gap-3 shadow-[4px_4px_0_var(--color-coral)]"
          >
            <span className="text-xl animate-wiggle">⚠️</span>
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {!quiz && !results && (
          <div className="max-w-2xl">
            <QuizUpload onGenerate={handleGenerate} loading={loading} />
          </div>
        )}

        {quiz && !results && (
          <div className="max-w-3xl">
            <QuizCard quiz={quiz} onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {results && (
          <div className="max-w-3xl">
            <QuizResults results={results} onRetry={() => {
              setQuiz(null);
              setResults(null);
            }} />
          </div>
        )}
      </div>

      {/* Routing Feed Sidebar - compact and consistent */}
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
