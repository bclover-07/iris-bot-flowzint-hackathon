'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import BudgetMeter from '@/components/ui/BudgetMeter';
import { RiMenuLine, RiWallet3Line } from 'react-icons/ri';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';

function DashboardInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, userLoading, stats } = useDashboard();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {});
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (userLoading) {
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardInner>{children}</DashboardInner>
    </DashboardProvider>
  );
}
