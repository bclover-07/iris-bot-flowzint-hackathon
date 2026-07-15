'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCheckLine, RiLoader4Line } from 'react-icons/ri';

const STEPS = [
  { id: 1, label: 'Sentiment' },
  { id: 2, label: 'Security' },
  { id: 3, label: 'KB RAG' },
  { id: 4, label: 'Router' },
  { id: 5, label: 'LLM Gen' },
  { id: 6, label: 'Validate' },
];

/**
 * Renders a live visual flow of the LangGraph agent execution.
 * Connects to live routing feed steps and highlights the active nodes.
 */
export default function AgentThinkingGraph({ currentStep = 0, status = 'idle', logs = [] }) {
  return (
    <div className="bg-cream border-[3px] border-ink rounded-2xl p-4 shadow-[4px_4px_0_#1A1A2E] w-full">
      <h4 className="text-[10px] font-black uppercase text-ink/50 tracking-[0.2em] mb-4">
        Cognitive Workflow Graph
      </h4>

      {/* Steps Node Flow */}
      <div className="grid grid-cols-6 gap-1 relative mb-4">
        {/* Connecting Line background */}
        <div className="absolute top-[18px] left-[8%] right-[8%] h-[4px] bg-ink/20 z-0 rounded" />

        {STEPS.map((step) => {
          const isActive = currentStep === step.id && status !== 'done';
          const isCompleted = currentStep > step.id || status === 'done';
          const isPending = currentStep < step.id && status !== 'done';

          let nodeColor = 'bg-white border-ink/30 text-ink/40';
          if (isActive) nodeColor = 'bg-sunny border-ink text-ink ring-4 ring-sunny/30';
          if (isCompleted) nodeColor = 'bg-mint border-ink text-ink';

          return (
            <div key={step.id} className="flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-[2px_2px_0_#1A1A2E] transition-all duration-300 ${nodeColor}`}
              >
                {isCompleted ? (
                  <RiCheckLine className="w-5 h-5 text-ink font-bold" />
                ) : isActive ? (
                  <RiLoader4Line className="w-4 h-4 animate-spin text-ink" />
                ) : (
                  step.id
                )}
              </motion.div>
              <span className={`text-[8px] font-black uppercase tracking-wider mt-2 text-center transition-all ${
                isActive ? 'text-ink' : isCompleted ? 'text-ink/75' : 'text-ink/45'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live trace log message */}
      <AnimatePresence mode="wait">
        {logs.length > 0 && (
          <motion.div
            key={logs[logs.length - 1]}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white border-2 border-ink/10 rounded-xl p-2.5 font-mono text-[9px] font-bold text-ink/80 truncate shadow-[2px_2px_0_#1A1A2E/5]"
          >
            <span className="text-iris-purple">LOG:</span> {logs[logs.length - 1]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
