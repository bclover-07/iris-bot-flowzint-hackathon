'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { RiMenuLine, RiCloseLine } from 'react-icons/ri';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-cream border-b-3 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-3xl font-black tracking-tighter text-ink flex items-center gap-1">
              IRIS Bot <span className="text-iris-purple">✦</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-ink font-bold hover:text-iris-purple transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-ink font-bold hover:text-iris-purple transition-colors">
              Features
            </a>
            <Link href="/login" className="text-ink font-bold hover:text-iris-purple transition-colors">
              Login
            </Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-sm">
              Get Started →
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-ink p-2 border-3 border-transparent hover:border-ink transition-colors"
            >
              {isOpen ? <RiCloseLine className="h-6 w-6" /> : <RiMenuLine className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-cream border-b-3 border-ink overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
              <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-ink font-bold text-lg p-2 border-b-2 border-ink border-dashed">
                How It Works
              </a>
              <a href="#features" onClick={() => setIsOpen(false)} className="text-ink font-bold text-lg p-2 border-b-2 border-ink border-dashed">
                Features
              </a>
              <Link href="/login" onClick={() => setIsOpen(false)} className="text-ink font-bold text-lg p-2 border-b-2 border-ink border-dashed">
                Login
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="btn-primary justify-center mt-4">
                Get Started →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
