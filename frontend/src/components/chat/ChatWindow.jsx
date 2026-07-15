'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDF9F3] p-4 sm:p-6 lg:p-8 custom-scrollbar">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          {/* Animated hero icon */}
          <motion.div 
            className="text-5xl md:text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            ✦
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-ink mb-3 tracking-tight">Welcome to IRIS</h2>
          <p className="text-ink/70 font-bold max-w-md mb-8 text-base md:text-lg leading-relaxed">
            Ask anything — from simple facts to complex code problems. Watch how IRIS routes each query.
          </p>
          
          {/* Suggestion cards - compact layout to avoid overlapping input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
            {[
              { label: 'Simple', example: '"What is HTTP?"', tier: 'Kimi K2.6', color: 'mint', borderColor: '#6BCB77' },
              { label: 'Medium', example: '"Explain TCP vs UDP"', tier: 'Haiku 4.5', color: 'sunny', borderColor: '#FFD93D' },
              { label: 'Complex', example: '"Write a REST API"', tier: 'Sonnet 4.6', color: 'coral', borderColor: '#FF6B6B' },
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                className="bg-white p-4 md:p-5 rounded-2xl border-[4px] border-ink text-left flex flex-col relative overflow-hidden"
                style={{ 
                  boxShadow: '6px 6px 0px #1A1A2E',
                  borderTopWidth: '10px',
                  borderTopColor: item.borderColor
                }}
                whileHover={{ y: -4, boxShadow: '8px 8px 0px #1A1A2E' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black uppercase text-ink/50 tracking-[0.2em]">{item.label}</p>
                  <span 
                    className="w-2.5 h-2.5 rounded-full border-2 border-ink"
                    style={{ backgroundColor: item.borderColor }}
                  />
                </div>
                <p className="text-sm font-bold text-ink mb-4 flex-grow leading-snug">
                  {item.example}
                </p>
                <div>
                  <span className="inline-block px-2.5 py-1 font-bold text-[9px] uppercase border-[2px] border-ink bg-cream text-ink rounded-full tracking-wider">
                    → {item.tier}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5 max-w-4xl mx-auto">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
