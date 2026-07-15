'use client';

export default function TypingIndicator() {
  return (
    <div className="w-full flex justify-start">
      <div className="flex gap-4 p-5 mb-2 bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] rounded-[2rem] rounded-tl-sm w-fit animate-slide-up">
        
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-mint border-[3px] border-ink shadow-[2px_2px_0_#1A1A2E] text-ink text-base font-black">
          ✦
        </div>
        
        <div className="flex items-center gap-2 px-2">
          <span className="w-3 h-3 bg-ink border-[2px] border-ink rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-3 h-3 bg-ink border-[2px] border-ink rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-3 h-3 bg-ink border-[2px] border-ink rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-lg text-ink/70 ml-3 font-caveat font-bold tracking-wide mt-1">IRIS is thinking...</span>
        </div>
      </div>
    </div>
  );
}
