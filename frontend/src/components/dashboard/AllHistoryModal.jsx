import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiRouteLine, RiEyeLine } from 'react-icons/ri';
import { TIER_COLORS } from '@/lib/constants';

export default function AllHistoryModal({ history, onClose, onSelectQuery }) {
  if (!history) return null;

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
          className="bg-cream w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border-[4px] border-ink shadow-[8px_8px_0_#1A1A2E] rounded-3xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-ink p-6 bg-white">
            <div>
              <h2 className="text-2xl font-black text-ink uppercase tracking-tight flex items-center gap-2">
                <RiRouteLine className="w-6 h-6" /> All-Time Query History
              </h2>
              <p className="text-ink/70 font-bold mt-1 text-sm">Every query processed across all your sessions</p>
            </div>
            <button
              onClick={onClose}
              className="bg-coral text-white p-2 border-2 border-ink shadow-[2px_2px_0_#1A1A2E] rounded-full hover:-translate-y-1 hover:shadow-[4px_4px_0_#1A1A2E] transition-all shrink-0"
            >
              <RiCloseLine className="w-6 h-6" />
            </button>
          </div>

          {/* List Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.length > 0 ? (
                history.map((query, i) => (
                  <div 
                    key={query.id || i} 
                    onClick={() => {
                      onSelectQuery(query);
                    }}
                    className="group cursor-pointer bg-white border-[3px] border-ink rounded-2xl p-4 shadow-[4px_4px_0_#1A1A2E] hover:shadow-[2px_2px_0_#1A1A2E] hover:translate-y-1 hover:translate-x-1 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 border-ink rounded-full ${TIER_COLORS[query.tier] || 'bg-white'}`}>
                        {query.model?.split('/')[1] || query.model || 'Unknown'}
                      </span>
                      <RiEyeLine className="w-5 h-5 text-ink/40 group-hover:text-ink transition-colors" />
                    </div>
                    <p className="font-bold text-ink text-sm line-clamp-3 mb-3 flex-1">&quot;{query.query || 'View details...'}&quot;</p>
                    <div className="flex justify-between items-center text-xs font-bold text-ink/60 border-t-2 border-ink/10 pt-2 mt-auto">
                      <span>{new Date(query.timestamp).toLocaleString()}</span>
                      <span className="bg-cream px-2 py-0.5 rounded border-2 border-ink text-ink font-black">${Number(query.cost || 0).toFixed(4)}</span>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="col-span-full text-center text-ink/60 font-bold text-lg border-[3px] border-dashed border-ink/40 rounded-2xl p-8">No queries found.</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
