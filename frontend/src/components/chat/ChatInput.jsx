'use client';
import { useState, useRef, useCallback } from 'react';
import { RiSendPlaneLine, RiLoader4Line, RiErrorWarningLine, RiAttachmentLine, RiFileTextLine } from 'react-icons/ri';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

export default function ChatInput({ onSend, disabled, isLoading, budgetExceeded }) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachedFileText, setAttachedFileText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSendRef = useRef(0);

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [socraticEnabled, setSocraticEnabled] = useState(false);

  const handleSend = useCallback(() => {
    const now = Date.now();
    if (now - lastSendRef.current < 1000) return;
    
    const finalMessage = attachedFileText 
      ? `[Attached Document: ${attachedFileName}]\n${attachedFileText}\n\nUser Query: ${message}` 
      : message;

    if (!finalMessage.trim() || disabled) return;

    lastSendRef.current = now;

    // Run the send callback in the background to avoid blocking the input reset
    onSend(finalMessage.trim(), { webSearch: webSearchEnabled, socratic: socraticEnabled })
      .catch((err) => console.error('Send error:', err));

    // Instantly clear the input and attachment states
    setMessage('');
    setAttachedFileText('');
    setAttachedFileName('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend, attachedFileText, attachedFileName, webSearchEnabled, socraticEnabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.post('/api/upload/document', formData);
      setAttachedFileText(data.text);
      setAttachedFileName(file.name);
    } catch (err) {
      console.error('File upload failed:', err);
      setAttachedFileText('[Attachment uploaded: We encountered an issue reading this file. You can still ask your question or describe what is in the document.]');
      setAttachedFileName(file.name || 'document');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border-t-[4px] border-ink bg-white p-3 md:p-4 relative z-20">
      <div className="max-w-4xl mx-auto">
        {budgetExceeded && (
          <div className="mb-3 px-4 py-3 bg-coral border-[3px] border-ink rounded-xl flex items-center gap-2 shadow-[3px_3px_0_#1A1A2E]">
            <RiErrorWarningLine className="w-5 h-5 text-ink flex-shrink-0" />
            <p className="text-ink font-black text-xs uppercase tracking-wider leading-tight">
              Budget Exceeded ($2.00 limit). Reset session.
            </p>
          </div>
        )}
        
        {attachedFileName && (
          <div className="mb-3 px-4 py-2 bg-cream border-[3px] border-ink rounded-xl flex items-center justify-between shadow-[3px_3px_0_#1A1A2E]">
            <div className="flex items-center gap-2 overflow-hidden">
              <RiFileTextLine className="w-5 h-5 text-ink flex-shrink-0" />
              <p className="text-ink font-bold text-sm truncate">
                {attachedFileName} attached
              </p>
            </div>
            <button 
              onClick={() => { setAttachedFileName(''); setAttachedFileText(''); }}
              className="text-ink/60 hover:text-coral font-bold text-lg ml-2 leading-none"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-[2px] transition-all flex items-center gap-1.5 ${
              webSearchEnabled 
                ? 'bg-iris-purple text-white border-ink shadow-[2px_2px_0_#1A1A2E]' 
                : 'bg-white text-ink/60 border-ink/20 hover:border-ink hover:text-ink hover:shadow-[2px_2px_0_#1A1A2E]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${webSearchEnabled ? 'bg-white' : 'bg-ink/30'}`} />
            Web Search
          </button>
          
          <button
            onClick={() => setSocraticEnabled(!socraticEnabled)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-[2px] transition-all flex items-center gap-1.5 ${
              socraticEnabled 
                ? 'bg-coral text-ink border-ink shadow-[2px_2px_0_#1A1A2E]' 
                : 'bg-white text-ink/60 border-ink/20 hover:border-ink hover:text-ink hover:shadow-[2px_2px_0_#1A1A2E]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full border border-ink/20 ${socraticEnabled ? 'bg-white' : 'bg-transparent'}`} />
            Socratic Teacher
          </button>
        </div>
        
        <div className="flex items-end gap-3 relative">
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,image/*,.txt"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || budgetExceeded || uploading}
            className="bg-cream text-ink border-[3px] border-ink rounded-full h-[52px] w-[52px] flex-shrink-0 flex items-center justify-center shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] active:translate-y-[3px] active:shadow-[1px_1px_0_#1A1A2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <RiLoader4Line className="w-6 h-6 animate-spin" />
            ) : (
              <RiAttachmentLine className="w-6 h-6" />
            )}
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={budgetExceeded ? 'Budget exceeded...' : 'Ask IRIS Bot anything...'}
            disabled={disabled || budgetExceeded}
            rows={1}
            className="w-full bg-cream border-[3px] border-ink rounded-2xl text-ink py-3.5 px-5 outline-none transition-all duration-300 font-medium resize-none min-h-[52px] max-h-[160px] disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-[4px_4px_0_#1A1A2E] focus:border-iris-purple focus:shadow-[4px_4px_0_var(--color-iris-purple)] custom-scrollbar placeholder:text-ink/40"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={(!message.trim() && !attachedFileText) || disabled || budgetExceeded}
            className="bg-iris-purple text-white border-[3px] border-ink rounded-full h-[52px] w-[52px] flex-shrink-0 flex items-center justify-center shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] active:translate-y-[3px] active:shadow-[1px_1px_0_#1A1A2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RiLoader4Line className="w-6 h-6 animate-spin text-white" />
            ) : (
              <RiSendPlaneLine className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>
        
        <div className="flex justify-between items-center mt-2 px-1">
          <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
            Shift+Enter for new line
          </p>
          <p className="text-[10px] text-ink/30 font-mono font-bold">
            15/min
          </p>
        </div>
      </div>
    </div>
  );
}
