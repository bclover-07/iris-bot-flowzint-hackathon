'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiUploadCloud2Line, RiLoader4Line, RiBookOpenLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import { api } from '@/lib/api';

export default function QuizUpload({ onGenerate, loading }) {
  const [topic, setTopic] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [mode, setMode] = useState('topic');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleSubmit = () => {
    if (mode === 'topic' && !topic.trim()) return;
    if ((mode === 'notes' || mode === 'pdf') && !noteContent.trim()) return;

    onGenerate({
      topic: mode === 'topic' ? topic : (fileName ? `Notes from ${fileName}` : ''),
      noteContent: (mode === 'notes' || mode === 'pdf') ? noteContent : '',
      difficulty,
      numQuestions,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.post('/api/upload/pdf', formData);
      setNoteContent(data.text);
    } catch (err) {
      console.error(err);
      alert('Failed to parse PDF.');
      setFileName('');
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="neo-card p-6 md:p-8 bg-white border-t-[16px] border-t-sunny">
      <h3 className="text-3xl font-black text-ink mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-sunny border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0_#1A1A2E]">
          <RiBookOpenLine className="w-6 h-6 text-ink" />
        </div>
        Configure Quiz
      </h3>

      <div className="flex gap-2 mb-4">
        {['topic', 'notes', 'pdf'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-3 font-bold uppercase tracking-widest text-sm transition-all border-[3px] rounded-full ${
              mode === m 
                ? 'bg-ink text-cream border-ink shadow-[4px_4px_0_#FFD93D]' 
                : 'bg-transparent border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            {m === 'topic' ? 'Enter Topic' : m === 'notes' ? 'Paste Notes' : 'Upload PDF'}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-black text-ink uppercase tracking-widest mb-3 ml-2">
          {mode === 'topic' ? 'Subject / Topic' : mode === 'pdf' ? 'Upload PDF Document' : 'Study Notes Content'}
        </label>
        {mode === 'topic' ? (
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., Photosynthesis, Data Structures, WW2..."
            className="input-brutal text-lg p-5"
          />
        ) : mode === 'pdf' ? (
          <div className="mb-4">
            <label className="border-[3px] border-dashed border-ink hover:border-iris-purple bg-cream p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all rounded-2xl shadow-[4px_4px_0_#1A1A2E] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A2E]">
              {fileLoading ? (
                <RiLoader4Line className="w-8 h-8 text-iris-purple animate-spin" />
              ) : (
                <RiUploadCloud2Line className="w-8 h-8 text-ink/40" />
              )}
              <span className="text-sm font-bold text-ink">
                {fileLoading ? 'Extracting text...' : fileName ? fileName : 'Click or drag PDF to upload'}
              </span>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={fileLoading}
              />
            </label>
            {fileName && !fileLoading && (
              <p className="text-[10px] text-mint font-bold uppercase tracking-widest mt-2 ml-2">Text extracted successfully! Ready to generate quiz.</p>
            )}
          </div>
        ) : (
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Paste your study notes here..."
            rows={6}
            className="input-brutal text-lg p-5 resize-none"
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <label className="block text-sm font-black text-ink uppercase tracking-widest mb-3 ml-2">
            Difficulty Level
          </label>
          <div className="relative">
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="input-brutal text-lg p-5 appearance-none cursor-pointer pr-12 bg-white"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none border-l-[4px] border-ink bg-cream rounded-r-2xl">
              <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-black text-ink uppercase tracking-widest mb-3 ml-2">
            Number of Questions
          </label>
          <div className="relative">
            <select
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
              className="input-brutal text-lg p-5 appearance-none cursor-pointer pr-12 bg-white"
            >
              {[3, 5, 7, 10].map(n => (
                <option key={n} value={n}>{n} Questions</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none border-l-[4px] border-ink bg-cream rounded-r-2xl">
              <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-3 text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RiLoader4Line className="w-7 h-7 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <RiUploadCloud2Line className="w-7 h-7" />
            Generate Quiz Now
          </>
        )}
      </button>
    </div>
  );
}
