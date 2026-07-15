import { motion } from 'framer-motion';

const shimmerVariants = {
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function ChatSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full p-4">
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
          className={`flex gap-4 p-6 bg-white border-[4px] border-ink rounded-[2rem] shadow-[6px_6px_0_#1A1A2E] ${i % 2 === 0 ? 'ml-auto rounded-tr-sm bg-cream' : 'mr-auto rounded-tl-sm'} w-3/4`}
        >
          <motion.div 
            variants={shimmerVariants}
            animate="pulse"
            className="w-12 h-12 rounded-full skeleton border-[3px] border-ink shrink-0"
          />
          <div className="flex-1 space-y-4 py-2">
            <motion.div 
              variants={shimmerVariants}
              animate="pulse"
              className="h-4 skeleton rounded-full w-1/4"
            />
            <div className="space-y-2">
              <motion.div 
                variants={shimmerVariants}
                animate="pulse"
                className="h-4 skeleton rounded-full"
              />
              <motion.div 
                variants={shimmerVariants}
                animate="pulse"
                className="h-4 skeleton rounded-full w-5/6"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-3xl">
      <motion.div 
        variants={shimmerVariants}
        animate="pulse"
        className="h-32 skeleton border-[4px] border-ink rounded-3xl shadow-[6px_6px_0_#1A1A2E]"
      />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <motion.div 
            key={i} 
            variants={shimmerVariants}
            animate="pulse"
            className="h-20 skeleton border-[4px] border-ink rounded-2xl shadow-[4px_4px_0_#1A1A2E]"
          />
        ))}
      </div>
    </div>
  );
}

export function CareerSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-3xl">
      <motion.div 
        variants={shimmerVariants}
        animate="pulse"
        className="h-12 skeleton border-[4px] border-ink rounded-full w-48 mb-10 shadow-[4px_4px_0_#1A1A2E]"
      />
      {[1, 2].map(i => (
        <motion.div 
          key={i} 
          variants={shimmerVariants}
          animate="pulse"
          className="h-64 skeleton border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E]"
        />
      ))}
    </div>
  );
}

