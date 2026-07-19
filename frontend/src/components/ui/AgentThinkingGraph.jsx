'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCheckLine, 
  RiLoader4Line, 
  RiEmotionNormalLine, 
  RiShieldKeyholeLine, 
  RiDatabaseLine, 
  RiGitCommitLine, 
  RiCpuLine, 
  RiShieldCheckLine, 
  RiTimeLine,
  RiArrowRightSLine
} from 'react-icons/ri';

const STEPS = [
  { id: 1, label: 'Sentiment Analysis', icon: RiEmotionNormalLine, color: 'bg-sunny' },
  { id: 2, label: 'PIGuard Firewall', icon: RiShieldKeyholeLine, color: 'bg-coral' },
  { id: 3, label: 'RAG Retrieval', icon: RiDatabaseLine, color: 'bg-sky' },
  { id: 4, label: 'Cognitive Router', icon: RiGitCommitLine, color: 'bg-iris-purple' },
  { id: 5, label: 'LLM Generation', icon: RiCpuLine, color: 'bg-sunny' },
  { id: 6, label: 'Output Validator', icon: RiShieldCheckLine, color: 'bg-mint' },
];

export default function AgentThinkingGraph({ events = [], currentStep = 0, status = 'idle', logs = [] }) {
  // Extract step data helper
  const getStepData = (stepId) => {
    const doneEvent = events.find(
      (e) => e.type === 'routing_step' && e.step === stepId && e.status === 'done'
    );
    return doneEvent ? doneEvent.data : null;
  };

  const getStepMessage = (stepId) => {
    const doneEvent = events.find(
      (e) => e.type === 'routing_step' && e.step === stepId && e.status === 'done'
    );
    return doneEvent ? doneEvent.message : null;
  };

  return (
    <div className="bg-white border-[3px] border-ink rounded-2xl p-4 shadow-[4px_4px_0_#1A1A2E] w-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 border-b-[2px] border-ink/10 pb-2 shrink-0">
        <h4 className="text-[10px] font-black uppercase text-ink/65 tracking-[0.2em]">
          Cognitive Decision Flow
        </h4>
        {status !== 'idle' && status !== 'done' && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-iris-purple animate-pulse">
            <RiLoader4Line className="w-3.5 h-3.5 animate-spin" /> Thinking...
          </span>
        )}
      </div>

      {/* Vertical Steps Timeline */}
      <div className="relative pl-3 space-y-4 max-h-[360px] overflow-y-auto pr-1 min-h-0">
        {/* Continuous Pipeline Connector Line */}
        <div className="absolute left-[20px] top-[10px] bottom-[15px] w-[3px] bg-ink/10 rounded" />
        
        {/* Animated Progress Overlay Line */}
        <div className="absolute left-[20px] top-[10px] w-[3px] bg-iris-purple rounded transition-all duration-500"
             style={{ 
               height: `${Math.max(0, Math.min(100, ((currentStep - 0.5) / STEPS.length) * 100))}%` 
             }} 
        />

        {STEPS.map((step) => {
          const isActive = currentStep === step.id && status !== 'done';
          const isCompleted = currentStep > step.id || status === 'done';
          const isPending = currentStep < step.id && status !== 'done';

          const StepIcon = step.icon;
          const stepData = getStepData(step.id);
          const stepMsg = getStepMessage(step.id);

          // Node styling rules
          let nodeBg = 'bg-white border-ink/20 text-ink/30';
          let borderStyle = 'border-ink/20';
          if (isActive) {
            nodeBg = `${step.color} text-white border-ink ring-4 ring-sunny/30 shadow-[2px_2px_0_#1A1A2E]`;
            borderStyle = 'border-ink';
          } else if (isCompleted) {
            nodeBg = 'bg-mint text-ink border-ink shadow-[2px_2px_0_#1A1A2E]';
            borderStyle = 'border-ink';
          }

          return (
            <motion.div 
              key={step.id} 
              className="flex gap-3 items-start relative z-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.id * 0.05 }}
            >
              {/* Timeline Bullet Node */}
              <motion.div
                className={`w-7 h-7 rounded-full border-[2.5px] flex items-center justify-center shrink-0 transition-all duration-300 ${nodeBg} ${borderStyle}`}
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {isCompleted ? (
                  <RiCheckLine className="w-4.5 h-4.5 font-black" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </motion.div>

              {/* Node Details Card */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold transition-all ${
                    isActive ? 'text-ink font-black scale-105 origin-left' : isCompleted ? 'text-ink/80' : 'text-ink/40'
                  }`}>
                    {step.label}
                  </span>
                  
                  {isActive && (
                    <span className="px-1.5 py-0.5 text-[8px] font-black uppercase border-[1.5px] border-ink bg-sunny text-ink rounded shadow-[1px_1px_0_#1A1A2E] animate-pulse">
                      Active
                    </span>
                  )}
                </div>

                {/* Sub-details (if completed and data exists) */}
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 bg-cream/35 border border-ink/10 rounded-lg p-2 font-mono text-[11px] text-ink/75 space-y-1 shadow-[1px_1px_0_rgba(0,0,0,0.02)]"
                  >
                    {/* Render specific metrics per step */}
                    {step.id === 1 && stepData && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded border border-ink/15 bg-white font-bold">{stepData.label} {stepData.emoji}</span>
                        <span className="text-ink/50">Score: {Math.round(stepData.score * 100)}%</span>
                        <span className="text-ink/50">Trend: {stepData.trend}</span>
                      </div>
                    )}

                    {step.id === 2 && stepData && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black uppercase ${
                          stepData.isInjection ? 'bg-coral/10 border-coral text-coral' : 'bg-mint/10 border-mint text-ink'
                        }`}>
                          {stepData.threatLevel.toUpperCase()}
                        </span>
                        <span className="text-ink/60 truncate">{stepMsg || 'No injection threats.'}</span>
                      </div>
                    )}

                    {step.id === 3 && stepData && (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded border border-ink/15 bg-white font-bold uppercase">{stepData.source}</span>
                          {stepData.score && <span className="text-ink/50">Match: {stepData.score}%</span>}
                        </div>
                        {stepData.direct && <span className="text-[10px] font-black text-mint uppercase">⚡ Direct bypass (Bypassed LLM)</span>}
                      </div>
                    )}

                    {step.id === 4 && stepData && (
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded border border-ink/15 bg-sunny font-bold">{stepData.modelDisplayName}</span>
                          <span className="text-ink/50 uppercase text-[10px]">Tier: {stepData.classification?.tier}</span>
                          {stepData.degraded && (
                            <span className="px-1.5 py-0.5 bg-coral text-white font-bold rounded text-[9px] uppercase animate-pulse">Budget Degraded</span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink/60 italic leading-tight">{stepData.routingReason}</p>
                      </div>
                    )}

                    {step.id === 5 && stepData && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ink/60">In: <b>{stepData.tokens?.input || stepData.inputTokens || 0}</b> / Out: <b>{stepData.tokens?.output || stepData.outputTokens || 0}</b> toks</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                        <span className="font-bold text-ink/75">Cost: ${stepData.cost?.toFixed(6)}</span>
                      </div>
                    )}

                    {step.id === 6 && stepData && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-mint font-bold flex items-center gap-0.5">
                            Passed validation
                          </span>
                          {stepData.costSavings?.savedPercent > 0 && (
                            <span className="px-1.5 py-0.5 bg-mint/10 border border-mint rounded text-mint font-black">
                              Saved {stepData.costSavings.savedPercent}% vs Sonnet 4.6
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!stepData && stepMsg && (
                      <div className="text-ink/60">{stepMsg}</div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Log Feed Console */}
      {logs.length > 0 && (
        <div className="mt-4 bg-ink text-cream border-[3px] border-ink rounded-2xl p-3 font-mono text-[9px] tracking-tight shadow-[3px_3px_0_rgba(0,0,0,0.15)] max-h-[110px] overflow-y-auto flex flex-col gap-1.5 shrink-0 select-none">
          <div className="text-[10px] font-black uppercase text-sunny border-b border-white/20 pb-1 mb-1 flex items-center justify-between shrink-0">
            <span>⚙️ Live Execution Terminal</span>
            <span className="text-[7px] text-white/50 lowercase">latest on top</span>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {logs.map((log, index) => (
                <motion.div
                  key={`${index}-${log}`}
                  initial={index === 0 ? { opacity: 0, x: -10 } : { opacity: 1 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`leading-normal flex items-start gap-1 ${
                    index === 0 ? 'text-sunny font-black' : 'text-white/60'
                  }`}
                >
                  <span className="shrink-0">{index === 0 ? '▶' : '•'}</span>
                  <span className="break-words">{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
