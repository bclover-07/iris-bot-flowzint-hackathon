import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiTimeLine, RiBrainLine, RiRouteLine, RiExchangeDollarLine, RiFileList3Line } from 'react-icons/ri';
import { TIER_COLORS } from '@/lib/constants';

export default function JourneyModal({ queryData, onClose }) {
  if (!queryData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cream w-full max-w-4xl max-h-[90vh] overflow-y-auto border-[4px] border-ink shadow-[8px_8px_0_#1A1A2E] rounded-3xl p-6 custom-scrollbar"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-ink pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-ink uppercase tracking-tight flex items-center gap-2">
                <RiRouteLine className="w-6 h-6" /> Query Journey Analysis
              </h2>
              <p className="text-ink/70 font-bold mt-1 text-sm">{new Date(queryData.timestamp).toLocaleString()}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-coral text-white p-2 border-2 border-ink shadow-[2px_2px_0_#1A1A2E] rounded-full hover:-translate-y-1 hover:shadow-[4px_4px_0_#1A1A2E] transition-all"
            >
              <RiCloseLine className="w-6 h-6" />
            </button>
          </div>

          {/* User Query Box */}
          <div className="bg-white border-[3px] border-ink rounded-2xl p-5 mb-8 shadow-[4px_4px_0_#1A1A2E] relative">
            <span className="absolute -top-3 left-4 bg-mint border-2 border-ink px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-ink">Original Query</span>
            <p className="font-bold text-ink whitespace-pre-wrap">{queryData.query}</p>
          </div>

          {/* Journey Pipeline */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-ink before:via-ink before:to-transparent">

            {/* Step 1: Context Window */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[4px] border-ink bg-white shadow-[4px_4px_0_#1A1A2E] z-10 text-ink shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <RiFileList3Line className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border-[3px] border-ink bg-white shadow-[4px_4px_0_#1A1A2E]">
                <h3 className="font-black text-ink uppercase tracking-widest text-sm mb-2">Context Window Optimization</h3>
                {queryData.tokens ? (
                  <div className="space-y-2 text-sm font-bold text-ink/80">
                    <div className="flex justify-between items-center bg-cream p-2 border-2 border-ink rounded-xl">
                      <span>Input Tokens</span>
                      <span className="text-ink font-black bg-white px-2 py-1 rounded border-2 border-ink">{queryData.tokens.input}</span>
                    </div>
                    <div className="flex justify-between items-center bg-cream p-2 border-2 border-ink rounded-xl">
                      <span>Output Tokens</span>
                      <span className="text-ink font-black bg-white px-2 py-1 rounded border-2 border-ink">{queryData.tokens.output}</span>
                    </div>
                    <p className="text-xs text-ink/60 mt-2 italic">* Text extracted locally via Mozilla OCR/PDF-Parse, preventing a flooded context window and saving thousands of image processing tokens.</p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-ink/70">No token data available.</p>
                )}
              </div>
            </div>

            {/* Step 2: Smart Routing */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[4px] border-ink bg-sunny shadow-[4px_4px_0_#1A1A2E] z-10 text-ink shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <RiRouteLine className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border-[3px] border-ink bg-white shadow-[4px_4px_0_#1A1A2E]">
                <h3 className="font-black text-ink uppercase tracking-widest text-sm mb-2">Smart Routing (Otari)</h3>
                <div className="space-y-3 text-sm font-bold text-ink/80">
                  <div className="flex justify-between items-center bg-cream p-2 border-2 border-ink rounded-xl">
                    <span>Model Selected</span>
                    <span className={`text-ink font-black px-2 py-1 rounded border-2 border-ink ${TIER_COLORS[queryData.tier] || 'bg-white'}`}>
                      {queryData.model.split('/')[1] || queryData.model}
                    </span>
                  </div>
                  <div className="bg-cream p-2 border-2 border-ink rounded-xl">
                    <span className="block mb-1">Reason:</span>
                    <span className="text-ink font-black text-xs leading-relaxed block">{queryData.routingReason}</span>
                  </div>
                  {queryData.analysisBreakdown && (
                     <div className="bg-cream p-2 border-2 border-ink rounded-xl">
                      <span className="block mb-1">Classifier Breakdown:</span>
                      <ul className="text-xs list-disc list-inside">
                        <li>Logic: {queryData.analysisBreakdown.logicScore} / 10</li>
                        <li>Context: {queryData.analysisBreakdown.contextDependencyScore} / 10</li>
                        <li>Creativity: {queryData.analysisBreakdown.creativityScore} / 10</li>
                        <li>Domain: {queryData.analysisBreakdown.domainComplexityScore} / 10</li>
                      </ul>
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Execution & Savings */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-[4px] border-ink bg-mint shadow-[4px_4px_0_#1A1A2E] z-10 text-ink shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <RiExchangeDollarLine className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border-[3px] border-ink bg-white shadow-[4px_4px_0_#1A1A2E]">
                <h3 className="font-black text-ink uppercase tracking-widest text-sm mb-2">Execution & Savings</h3>
                <div className="space-y-3 text-sm font-bold text-ink/80">
                  <div className="flex justify-between items-center bg-cream p-2 border-2 border-ink rounded-xl">
                    <span>Latency</span>
                    <span className="text-ink font-black flex items-center gap-1">
                      <RiTimeLine /> {queryData.latencyMs ? `${queryData.latencyMs}ms` : 'N/A'}
                    </span>
                  </div>
                  
                  {queryData.costSavings && (
                    <div className="bg-mint/20 p-3 border-2 border-mint rounded-xl mt-3">
                      <h4 className="font-black text-mint uppercase text-xs mb-2">Compared to Claude 3.5 Sonnet:</h4>
                      <div className="flex justify-between mb-1">
                        <span>Actual Cost:</span>
                        <span className="font-black">${queryData.costSavings.actualCost?.toFixed(6) || 0}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Sonnet Cost:</span>
                        <span className="font-black text-coral line-through">${queryData.costSavings.worstCaseCost?.toFixed(6) || 0}</span>
                      </div>
                      <div className="bg-mint text-white border-2 border-ink p-2 rounded-lg text-center font-black shadow-[2px_2px_0_#1A1A2E]">
                        SAVED {queryData.costSavings.savedPercent}% (${queryData.costSavings.saved?.toFixed(5)})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
