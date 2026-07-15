export default function BudgetWarningBanner({ mode }) {
  if (mode === 'normal') return null;

  const isExceeded = mode === 'exceeded';
  
  return (
    <div className={`p-4 md:p-5 m-5 md:m-8 mb-0 ${isExceeded ? 'bg-coral' : 'bg-sunny'} border-[4px] border-ink rounded-2xl shadow-[6px_6px_0_#1A1A2E] animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4 z-20`}>
      <div className="flex items-center gap-4">
        <span className={`w-10 h-10 flex items-center justify-center bg-white border-[3px] border-ink rounded-full text-2xl shadow-[2px_2px_0_#1A1A2E] ${isExceeded ? 'animate-wiggle' : 'animate-pulse'}`}>
          {isExceeded ? '⛔' : '⚠️'}
        </span>
        <div>
          <h4 className="font-black text-ink uppercase tracking-wider text-lg">
            {isExceeded ? 'Budget Exceeded' : 'Budget Warning'}
          </h4>
          <p className="text-ink font-bold mt-1 text-sm md:text-base">
            {isExceeded 
              ? 'You have reached the $2.00 session limit. API requests will be blocked.' 
              : 'You are approaching the $2.00 session limit. Switch to smaller models.'}
          </p>
        </div>
      </div>
    </div>
  );
}
