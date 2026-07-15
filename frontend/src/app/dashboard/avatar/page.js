'use client';
import dynamic from 'next/dynamic';

// Dynamically import the AvatarChat component with SSR disabled
// This is necessary because Three.js requires browser APIs (window, document)
const AvatarChat = dynamic(() => import('@/components/avatar/AvatarChat'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-ink rounded-full shadow-[4px_4px_0_#1A1A2E]">
        <div className="w-2.5 h-2.5 rounded-full bg-iris-purple animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-iris-purple animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-iris-purple animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-ink font-bold text-xs uppercase tracking-wider ml-2">Loading Avatar...</span>
      </div>
    </div>
  )
});

export default function AvatarPage() {
  return (
    <div className="h-[calc(100vh-6rem)] w-full">
      <AvatarChat />
    </div>
  );
}
