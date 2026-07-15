'use client';
import { useState } from 'react';
import { RiLoader4Line, RiCheckDoubleLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

export default function QuizCard({ quiz, onSubmit, loading }) {
  const [answers, setAnswers] = useState({});

  const handleSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const isComplete = quiz?.questions?.length === Object.keys(answers).length;
  const progress = quiz?.questions?.length ? (Object.keys(answers).length / quiz.questions.length) * 100 : 0;

  return (
    <div className="space-y-10 pb-12">
      
      <div className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md p-5 border-b-[4px] border-ink shadow-[0_6px_0_#1A1A2E] flex justify-between items-center mb-10 rounded-b-3xl">
        <h2 className="font-black text-2xl text-ink">Quiz in Progress</h2>
        <div className="flex items-center gap-4">
          <span className="font-black text-ink text-xl">{Object.keys(answers).length} / {quiz?.questions?.length}</span>
          <div className="w-40 h-6 bg-white border-[3px] border-ink shadow-[4px_4px_0_#1A1A2E] overflow-hidden rounded-full p-0.5">
            <div className="h-full bg-sunny rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {quiz?.questions?.map((question, index) => {
        const selected = answers[question.id];
        
        return (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            key={question.id} 
            className="neo-card p-6 md:p-10 bg-white relative border-l-[16px] border-l-iris-purple"
          >
            {/* Question Badge */}
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-iris-purple rounded-full border-[4px] border-ink shadow-[6px_6px_0_#1A1A2E] flex items-center justify-center rotate-[-12deg] hover:rotate-0 transition-transform">
              <span className="font-black text-white text-2xl">Q{index + 1}</span>
            </div>

            <div className="pl-6 md:pl-10 mb-8 mt-4">
              <p className="text-2xl font-black text-ink leading-relaxed">{question.question}</p>
            </div>

            <div className="space-y-4">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const style = isSelected
                  ? 'border-ink bg-mint shadow-[6px_6px_0_#1A1A2E] translate-x-1 translate-y-1'
                  : 'border-ink bg-cream hover:bg-white hover:shadow-[6px_6px_0_#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,0.3)] hover:-translate-y-1';

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(question.id, i)}
                    className={`w-full text-left px-6 py-5 border-[4px] rounded-2xl transition-all flex items-center gap-5 ${style}`}
                  >
                    <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-[3px] border-ink font-black text-lg ${isSelected ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-bold text-ink text-lg leading-tight">{opt}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <div className="pt-6">
        <button
          onClick={() => onSubmit(answers)}
          disabled={!isComplete || loading}
          className="btn-primary w-full p-6 md:p-8 flex items-center justify-center gap-4 text-2xl md:text-3xl disabled:opacity-50 disabled:cursor-not-allowed bg-iris-purple"
        >
          {loading ? (
            <>
              <RiLoader4Line className="w-10 h-10 animate-spin" />
              Grading Quiz...
            </>
          ) : (
            <>
              <RiCheckDoubleLine className="w-10 h-10" />
              Submit Answers
            </>
          )}
        </button>
        {!isComplete && (
          <p className="text-center font-bold text-coral mt-6 font-caveat text-3xl animate-pulse">
            Answer all questions to submit!
          </p>
        )}
      </div>
    </div>
  );
}
