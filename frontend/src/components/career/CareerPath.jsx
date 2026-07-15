'use client';
import { RiTimeLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const getDifficultyTheme = (diff) => {
  const d = diff?.toLowerCase() || '';
  if (d.includes('beginner')) return { color: 'mint', label: 'Beginner' };
  if (d.includes('advanced')) return { color: 'coral', label: 'Advanced' };
  return { color: 'sunny', label: 'Intermediate' }; // default/intermediate
};

export default function CareerPath({ report }) {
  const paths = Array.isArray(report) ? report : [];

  return (
    <div className="space-y-12">
      {paths.map((path, index) => {
        const theme = getDifficultyTheme(path.difficulty);
        const cardColors = ['peach', 'sky', 'iris-purple'];
        const cardAccent = cardColors[index % cardColors.length];

        return (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, type: "spring" }}
            key={index} 
            className={`neo-card bg-white p-8 md:p-10 border-l-[16px] border-l-${cardAccent} relative`}
          >
            {/* Path Number Badge */}
            <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-${cardAccent} border-[4px] border-ink flex items-center justify-center shadow-[6px_6px_0_#1A1A2E] rotate-12 hover:rotate-0 transition-transform`}>
              <span className="font-black text-ink text-2xl">#{index + 1}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 pr-10">
              <div>
                <h3 className="text-3xl font-black text-ink leading-tight mb-4">{path.title}</h3>
                <span className={`tag-sticker bg-${theme.color} text-ink shadow-[4px_4px_0_#1A1A2E]`}>
                  {theme.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-10 bg-cream p-5 border-[4px] border-ink shadow-[inset_4px_4px_0_rgba(0,0,0,0.05)] rounded-[2rem]">
              <div className="flex items-center gap-3 bg-white px-5 py-2 border-[3px] border-ink rounded-full">
                <RiTimeLine className="w-6 h-6 text-ink" />
                <span className="text-lg font-bold text-ink">{path.timeframe}</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-2 border-[3px] border-ink rounded-full">
                <RiMoneyDollarCircleLine className="w-6 h-6 text-mint" />
                <span className="text-lg font-black text-ink">{path.salaryRange}</span>
              </div>
            </div>

            {path.skills?.length > 0 && (
              <div className="mb-10">
                <p className="text-sm font-black text-ink uppercase tracking-widest mb-4 border-b-[3px] border-ink/10 pb-2">Required Skills</p>
                <div className="flex flex-wrap gap-3">
                  {path.skills.map((skill, i) => (
                    <span key={i} className="px-4 py-2 text-sm font-bold bg-white border-[3px] border-ink text-ink rounded-xl shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1A1A2E] transition-all">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {path.steps?.length > 0 && (
              <div className="bg-cream rounded-3xl border-[4px] border-ink p-8 shadow-[6px_6px_0_#1A1A2E]">
                <p className="text-sm font-black text-ink uppercase tracking-widest mb-6">Action Plan</p>
                <div className="space-y-5">
                  {path.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-8 h-8 flex-shrink-0 mt-0.5 rounded-full bg-${cardAccent} border-[3px] border-ink flex items-center justify-center font-bold text-ink text-sm shadow-[2px_2px_0_#1A1A2E]`}>
                        {i + 1}
                      </div>
                      <span className="text-lg font-medium text-ink pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
