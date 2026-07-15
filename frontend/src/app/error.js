'use client';

import { useEffect } from 'react';
import { RiAlertLine } from 'react-icons/ri';
import Link from 'next/link';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white border-[4px] border-ink shadow-[8px_8px_0_#1A1A2E] rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-coral border-[4px] border-ink rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#1A1A2E]">
          <RiAlertLine className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-ink mb-4">Oops! System Glitch.</h2>
        
        <p className="text-ink/70 font-bold mb-8">
          Something unexpected happened. Our AI bots are looking into it.
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full py-4 px-6 bg-sunny border-[3px] border-ink rounded-xl text-ink font-black uppercase tracking-widest shadow-[4px_4px_0_#1A1A2E] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0_#1A1A2E] transition-all"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full py-4 px-6 bg-white border-[3px] border-ink rounded-xl text-ink font-black uppercase tracking-widest shadow-[4px_4px_0_#1A1A2E] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0_#1A1A2E] transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
