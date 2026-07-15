'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css'; // Premium dark mode syntax highlighting
import RoutingChip from '@/components/ui/RoutingChip';
import InjectionBadge from '@/components/ui/InjectionBadge';
import { RiUser3Line, RiRobot2Line, RiFileCopyLine, RiCheckLine, RiShareForwardLine } from 'react-icons/ri';


export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isBlocked = message.isBlocked;
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'IRIS Response',
        text: message.content,
      }).catch(console.error);
    } else {
      handleCopy();
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // Neo-Brutalist rounded bubble styling
  let containerClass = 'flex gap-4 p-5 md:p-6 mb-2 animate-slide-up bg-white border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E]';
  let borderRadiusClass = 'rounded-[2rem] rounded-tl-sm'; // AI messages: square top-left
  let avatarColor = 'bg-mint text-ink';

  if (isUser) {
    containerClass = 'flex gap-4 p-5 md:p-6 mb-2 animate-slide-up bg-[#F5F0FF] border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E]';
    borderRadiusClass = 'rounded-[2rem] rounded-tr-sm'; // User messages: square top-right
    avatarColor = 'bg-iris-purple text-white';
  } else if (isError || isBlocked) {
    containerClass = 'flex gap-4 p-5 md:p-6 mb-2 animate-slide-up bg-[#FFF0F0] border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E]';
    borderRadiusClass = 'rounded-[2rem] rounded-tl-sm';
    avatarColor = 'bg-coral text-ink';
  }

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[85%]' : 'w-full max-w-full'} min-w-0 ${containerClass} ${borderRadiusClass}`}>
        
        {/* Avatar */}
        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-[3px] border-ink rounded-full shadow-[2px_2px_0_#1A1A2E] ${avatarColor}`}>
          {isUser ? <RiUser3Line className="w-6 h-6" /> : <RiRobot2Line className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0 pt-1 group relative">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-sm font-black text-ink uppercase tracking-widest">
              {isUser ? 'You' : 'IRIS'}
            </span>
            {!isUser && message.injectionStatus && (
              <InjectionBadge status={message.injectionStatus} />
            )}
          </div>

          <div className="text-base md:text-lg text-ink font-medium leading-relaxed break-words prose prose-base max-w-none prose-headings:font-black prose-a:text-iris-purple prose-code:font-mono prose-code:bg-cream prose-code:border-2 prose-code:border-ink/20 prose-code:px-2 prose-code:rounded-lg prose-pre:border-[4px] prose-pre:border-ink prose-pre:bg-ink prose-pre:text-cream prose-pre:shadow-[6px_6px_0_#1A1A2E] prose-pre:rounded-2xl">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto w-full my-6 rounded-xl border-[3px] border-ink shadow-[4px_4px_0_#1A1A2E]">
                      <table className="w-full text-left border-collapse bg-white table-auto break-words" {...props} />
                    </div>
                  ),
                  th: ({node, ...props}) => <th className="p-3 border-b-[3px] border-ink bg-cream font-black text-sm md:text-base whitespace-normal break-words" {...props} />,
                  td: ({node, ...props}) => <td className="p-3 border-b-2 border-ink/20 text-sm md:text-base whitespace-normal break-words align-top" {...props} />
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {!isUser && message.routing && (
            <div className="mt-6 pt-5 border-t-[3px] border-ink/10 flex flex-col gap-3">
              <RoutingChip routing={message.routing} cost={message.cost} />
              {message.routing.reason && (
                <p className="text-xs font-mono font-bold text-ink/70 mt-3 bg-white p-3 border-[3px] border-ink/20 rounded-xl">
                  <span className="text-ink">ROUTING_REASON:</span> {message.routing.reason}
                </p>
              )}
            </div>
          )}

          {!isUser && (
            <div className="mt-4 flex gap-2">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-ink rounded-lg shadow-[2px_2px_0_#1A1A2E] hover:translate-y-px hover:shadow-[1px_1px_0_#1A1A2E] transition-all text-xs font-black uppercase tracking-widest text-ink"
              >
                {copied ? <RiCheckLine className="w-4 h-4 text-mint" /> : <RiFileCopyLine className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-ink rounded-lg shadow-[2px_2px_0_#1A1A2E] hover:translate-y-px hover:shadow-[1px_1px_0_#1A1A2E] transition-all text-xs font-black uppercase tracking-widest text-ink"
              >
                {shared ? <RiCheckLine className="w-4 h-4 text-mint" /> : <RiShareForwardLine className="w-4 h-4" />}
                {shared ? 'Shared!' : 'Share'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
