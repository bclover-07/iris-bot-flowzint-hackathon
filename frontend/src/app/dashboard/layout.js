'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import BudgetMeter from '@/components/ui/BudgetMeter';
import { useBudget } from '@/hooks/useBudget';
import { RiMenuLine, RiWallet3Line } from 'react-icons/ri';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Use the actual user ID for the session to ensure isolation and personalization,
  // falling back to 'demo-session-id' only if the user hasn't loaded yet.
  const sessionId = user?._id || user?.id || 'demo-session-id';
  const { budget: stats, fetchBudget: fetchStats } = useBudget(sessionId);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(data => {
        setUser(data.user);
        fetchStats();
      })
      .catch((err) => {
        console.warn('Auth check failed:', err.message);
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router, fetchStats]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {});
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-ink">
        <motion.div 
          className="w-20 h-20 bg-iris-purple border-[4px] border-ink rounded-full mb-6 shadow-[8px_8px_0_#1A1A2E]"
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="font-mono font-bold animate-pulse text-lg">Loading IRIS Bot...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDF9F3] text-ink overflow-hidden p-4 md:p-6 gap-4">
      
      {/* Mobile Sidebar Overlay Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <AnimatePresence>
        <motion.div 
          className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          initial={false}
          animate={{ x: sidebarOpen ? 0 : undefined }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </motion.div>
      </AnimatePresence>
      
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden bg-cream border-[4px] border-ink rounded-[2rem] shadow-[8px_8px_0_#1A1A2E] relative">
        {/* Header bar */}
        <header className="h-16 md:h-[72px] border-b-[4px] border-ink flex items-center justify-between px-4 md:px-6 bg-white shrink-0 relative z-20 rounded-t-[calc(2rem-4px)] overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 text-ink bg-sunny border-[3px] border-ink rounded-xl hover:bg-iris-purple hover:text-white transition-all shadow-[3px_3px_0_#1A1A2E] active:translate-y-[2px] active:shadow-[1px_1px_0_#1A1A2E]"
            >
              <RiMenuLine className="w-5 h-5" />
            </button>
            <h2 className="font-black text-lg md:text-xl hidden sm:block tracking-tight text-ink whitespace-nowrap">Dashboard</h2>
          </div>
          
          {/* Compact Budget Meter */}
          <div className="flex items-center gap-3 min-w-0 max-w-[280px] md:max-w-[340px] bg-cream border-[3px] border-ink rounded-full px-4 py-2 shadow-[4px_4px_0_#1A1A2E]">
            <RiWallet3Line className="text-ink w-4 h-4 shrink-0" />
            {stats && <BudgetMeter budget={stats} />}
          </div>
        </header>
        
        {/* Scrollable content area with page transitions */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-cream relative z-0 custom-scrollbar">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
