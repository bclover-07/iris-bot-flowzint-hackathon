'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiRobot2Line, RiBookOpenLine, RiRocketLine, RiLogoutBoxLine, RiBarChartBoxLine, RiShieldCheckLine, RiCloseLine, RiUserVoiceLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', icon: RiRobot2Line, label: 'AI Assistant', color: 'iris-purple' },
  { href: '/dashboard/quiz', icon: RiBookOpenLine, label: 'Quiz Forge', color: 'sunny' },
  { href: '/dashboard/career', icon: RiRocketLine, label: 'Career Sim', color: 'peach' },
  { href: '/dashboard/avatar', icon: RiUserVoiceLine, label: 'Iris Avatar', color: 'sky' },
  { href: '/dashboard/analytics', icon: RiBarChartBoxLine, label: 'Analytics', color: 'mint' },
  { href: '/dashboard/security', icon: RiShieldCheckLine, label: 'Security', color: 'coral' },
];

export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <aside className="w-[300px] bg-white border-[4px] border-ink rounded-[2rem] shadow-[8px_8px_0_#1A1A2E] flex flex-col h-[calc(100vh-32px)] md:h-[calc(100vh-48px)] relative overflow-hidden">
      <div className="p-6 border-b-[4px] border-ink flex justify-between items-center bg-cream shrink-0">
        <Link href="/" className="flex flex-col group">
          <span className="text-3xl font-black text-ink flex items-center gap-2 group-hover:scale-105 transition-transform">
            IRIS Bot <span className="text-iris-purple animate-pulse">✦</span>
          </span>
          <span className="font-caveat text-ink/70 text-xl leading-none -mt-1 ml-1 group-hover:text-iris-purple transition-colors">
            Intelligent Routing
          </span>
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-ink bg-coral border-[3px] border-ink rounded-full shadow-[4px_4px_0_#1A1A2E] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#1A1A2E] transition-all"
          >
            <RiCloseLine className="w-6 h-6 text-white font-bold" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-6 space-y-4 overflow-y-auto bg-white custom-scrollbar">
        {navItems.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              className={`flex items-center gap-4 px-5 py-4 font-bold transition-all border-[4px] rounded-2xl relative
                ${active
                  ? `bg-${item.color}/10 border-${item.color} shadow-[6px_6px_0_var(--color-${item.color})] text-ink translate-y-[-2px]`
                  : 'bg-cream border-transparent text-ink/70 hover:border-ink hover:text-ink hover:shadow-[6px_6px_0_#1A1A2E] hover:-translate-y-1'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] border-ink bg-${item.color} shadow-[2px_2px_0_#1A1A2E]`}>
                <item.icon className="w-5 h-5 text-ink" />
              </div>
              <span className="text-lg tracking-tight">{item.label}</span>
              {active && (
                <motion.div 
                  layoutId="active-indicator"
                  className={`absolute right-4 w-3 h-3 rounded-full bg-${item.color} border-2 border-ink shadow-[2px_2px_0_#1A1A2E]`}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t-[4px] border-ink bg-cream shrink-0">
        {user && (
          <div className="mb-5 flex items-center gap-4 p-4 bg-white border-[3px] border-ink rounded-2xl shadow-[4px_4px_0_#1A1A2E]">
            <div className="w-12 h-12 bg-mint rounded-full border-[3px] border-ink flex items-center justify-center text-ink font-black text-xl shadow-[2px_2px_0_#1A1A2E]">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-base font-black text-ink truncate">{user.name}</p>
              <p className="text-xs font-mono font-bold text-ink/60 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-3 font-black text-ink bg-coral border-[4px] border-ink rounded-full px-5 py-4 w-full shadow-[6px_6px_0_#1A1A2E] hover:-translate-y-1 hover:shadow-[8px_8px_0_#1A1A2E] transition-all text-lg"
        >
          <RiLogoutBoxLine className="w-6 h-6" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
