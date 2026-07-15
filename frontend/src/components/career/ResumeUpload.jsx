'use client';
import { useState } from 'react';
import { RiRocketLine, RiLoader4Line, RiBriefcase4Line, RiCodeBoxLine } from 'react-icons/ri';

export default function ResumeUpload({ onAnalyze, loading }) {
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');

  const handleSubmit = () => {
    if (!targetRole.trim() && !currentSkills.trim()) return;
    onAnalyze({ targetRole, currentSkills });
  };

  return (
    <div className="neo-card p-6 md:p-10 bg-white border-t-[16px] border-t-peach">
      <h3 className="text-3xl font-black text-ink mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-peach border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0_#1A1A2E]">
          <RiRocketLine className="w-6 h-6 text-ink" />
        </div>
        Path Setup
      </h3>

      <div className="space-y-8 mb-10">
        <div>
          <label className="flex items-center gap-3 text-sm font-black text-ink uppercase tracking-widest mb-3 ml-2">
            <RiBriefcase4Line className="text-peach w-5 h-5" /> Dream Role
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g., Full Stack Developer, ML Engineer, Product Manager..."
            className="input-brutal text-lg p-5 bg-cream focus:bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-3 text-sm font-black text-ink uppercase tracking-widest mb-3 ml-2">
            <RiCodeBoxLine className="text-peach w-5 h-5" /> Current Skills
          </label>
          <textarea
            value={currentSkills}
            onChange={e => setCurrentSkills(e.target.value)}
            placeholder="e.g., Python, React, SQL, basic ML, communication, teamwork..."
            rows={5}
            className="input-brutal text-lg p-5 resize-none bg-cream focus:bg-white"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || (!targetRole.trim() && !currentSkills.trim())}
        className="btn-primary w-full flex items-center justify-center gap-4 text-xl py-5 bg-ink text-white hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RiLoader4Line className="w-7 h-7 animate-spin text-peach" />
            <span className="text-peach">Simulating Paths...</span>
          </>
        ) : (
          <>
            <RiRocketLine className="w-7 h-7 text-peach" />
            Generate Career Plan
          </>
        )}
      </button>
    </div>
  );
}
