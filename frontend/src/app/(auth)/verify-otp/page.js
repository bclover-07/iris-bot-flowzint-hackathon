'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiArrowRightLine, RiLoader4Line } from 'react-icons/ri';
import { getApiUrl } from '@/lib/api';

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setError('User ID missing. Please login again.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!userId) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP');
      } else {
        setSuccessMsg('A new OTP has been sent to your email.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="neo-card card-mint p-8"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-mint border-3 border-ink flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_#1A1A2E]">
            <RiShieldCheckLine className="w-8 h-8 text-ink" />
          </div>
          <h1 className="text-3xl font-black text-ink">Verify Email</h1>
          <p className="text-ink/60 font-medium mt-1">Enter the 6-digit code sent to your email</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-coral/20 border-3 border-coral text-coral font-bold text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-mint/20 border-3 border-mint text-ink font-bold text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center justify-center gap-2 text-xs font-bold text-ink/70 uppercase tracking-widest mb-3">
              Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
              className="input-brutal tracking-[12px] font-mono text-center text-3xl h-16"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary justify-center text-lg w-full"
          >
            {loading ? <RiLoader4Line className="animate-spin w-6 h-6" /> : (
              <>Verify <RiArrowRightLine className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t-2 border-ink/10 pt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-iris-purple hover:text-ink font-bold underline decoration-2 underline-offset-4 transition-colors text-sm"
          >
            Didn&apos;t receive the email? Resend OTP
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-10 w-32 h-10 bg-sunny border-3 border-ink animate-float" style={{ clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)' }}></div>
      <div className="absolute bottom-1/4 right-10 w-20 h-20 bg-iris-purple rounded-full border-3 border-ink animate-float" style={{ animationDelay: '1s' }}></div>

      <Suspense fallback={<div className="font-mono font-bold text-ink/50 animate-pulse">Loading...</div>}>
        <VerifyOTPForm />
      </Suspense>
    </div>
  );
}
