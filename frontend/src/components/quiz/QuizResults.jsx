'use client';
import { RiTrophyLine, RiEmotionSadLine, RiEmotionLine, RiRefreshLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

export default function QuizResults({ results, onRetry }) {
  if (!results) return null;

  const { score, total, percentage, feedback, results: detailedResults } = results;
  
  const getTheme = () => {
    if (percentage >= 80) return { color: 'mint', icon: RiTrophyLine, msg: 'Excellent Work!' };
    if (percentage >= 50) return { color: 'sunny', icon: RiEmotionLine, msg: 'Good Effort!' };
    return { color: 'coral', icon: RiEmotionSadLine, msg: 'Keep Studying!' };
  };

  const theme = getTheme();
  const IconComp = theme.icon;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`neo-card p-6 md:p-14 bg-white border-t-[16px] border-t-${theme.color} relative text-center`}
    >
      {/* Decorative badge */}
      <div className="absolute -top-8 -right-4 md:-top-10 md:-right-10 rotate-12 z-10">
        <div className={`w-24 h-24 md:w-32 md:h-32 bg-${theme.color} rounded-full border-[6px] border-ink flex items-center justify-center shadow-[6px_6px_0_#1A1A2E] md:shadow-[8px_8px_0_#1A1A2E] animate-wiggle`}>
          <span className="font-black text-ink text-2xl md:text-4xl">{percentage}%</span>
        </div>
      </div>

      <div className="mb-10 mt-6">
        <div className={`w-24 h-24 rounded-full bg-${theme.color} border-[4px] border-ink flex items-center justify-center mx-auto mb-8 shadow-[6px_6px_0_#1A1A2E]`}>
          <IconComp className="w-12 h-12 text-ink" />
        </div>
        
        <h3 className="text-6xl md:text-7xl font-black text-ink mb-4">{score}<span className="text-3xl md:text-4xl text-ink/40">/{total}</span></h3>
        <p className="text-3xl md:text-4xl font-caveat font-bold text-ink/80 mt-6">{theme.msg}</p>
      </div>

      {feedback && (
        <div className="bg-cream rounded-3xl border-[4px] border-ink p-6 md:p-8 mb-10 relative text-left shadow-[6px_6px_0_#1A1A2E] mt-12">
          <div className="absolute -top-5 left-6 bg-iris-purple px-5 py-1.5 rounded-full border-[3px] border-ink text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-[4px_4px_0_#1A1A2E]">
            AI Study Feedback
          </div>
          <p className="text-lg md:text-xl font-bold text-ink leading-relaxed whitespace-pre-wrap mt-2">
            {feedback}
          </p>
        </div>
      )}

      {/* Detailed Review Section */}
      {detailedResults && detailedResults.length > 0 && (
        <div className="mb-12 text-left space-y-6">
          <h4 className="text-2xl font-black uppercase tracking-tight text-ink border-b-[4px] border-ink pb-3 mb-6 inline-block">Detailed Review</h4>
          {detailedResults.map((item, index) => (
            <div key={item.id || index} className={`p-5 md:p-6 rounded-2xl border-[4px] border-ink shadow-[4px_4px_0_#1A1A2E] ${item.correct ? 'bg-mint/20' : 'bg-coral/20'}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`mt-1 shrink-0 w-8 h-8 rounded-full border-[3px] border-ink flex items-center justify-center shadow-[2px_2px_0_#1A1A2E] ${item.correct ? 'bg-mint' : 'bg-coral'}`}>
                  {item.correct ? <RiCheckLine className="text-ink font-bold" /> : <RiCloseLine className="text-white font-bold" />}
                </div>
                <p className="font-bold text-lg text-ink leading-snug">{item.question}</p>
              </div>
              
              <div className="pl-12 space-y-3">
                {!item.correct && (
                  <div className="bg-white/80 p-3 rounded-xl border-2 border-ink/20">
                    <span className="text-xs font-black uppercase text-coral block mb-1">Your Answer</span>
                    <span className="font-medium text-ink">{item.userAnswer}</span>
                  </div>
                )}
                <div className="bg-white p-3 rounded-xl border-[3px] border-ink shadow-[2px_2px_0_#1A1A2E]">
                  <span className="text-xs font-black uppercase text-mint block mb-1">Correct Answer</span>
                  <span className="font-bold text-ink">{item.correctAnswer}</span>
                </div>
                {item.explanation && (
                  <div className="mt-4 p-4 bg-white border-[3px] border-ink rounded-xl shadow-[3px_3px_0_#1A1A2E]">
                    <span className="text-xs font-black uppercase text-iris-purple block mb-2 tracking-widest">Explanation</span>
                    <p className="text-sm md:text-base font-medium text-ink/90 leading-relaxed">{item.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onRetry}
        className="btn-outline w-full justify-center text-xl md:text-2xl py-5 flex items-center gap-3 bg-cream hover:bg-iris-purple hover:text-white mt-8"
      >
        <RiRefreshLine className="w-6 h-6 md:w-8 md:h-8" />
        Create Another Quiz
      </button>
    </motion.div>
  );
}
