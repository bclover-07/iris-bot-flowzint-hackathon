'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiMailLine, RiLockLine, RiArrowRightLine, RiLoader4Line, RiShieldCheckLine } from 'react-icons/ri';
import { getApiUrl } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'otp_request' | 'otp_verify'
  const [userId, setUserId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'password') {
        const res = await fetch(`${getApiUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.userId) {
            router.push(`/verify-otp?userId=${data.userId}`);
          } else {
            setError(data.error || 'Login failed');
          }
          return;
        }
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        router.push('/dashboard');
      } else if (mode === 'otp_request') {
        const res = await fetch(`${getApiUrl()}/api/auth/login/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to send OTP');
          return;
        }
        setUserId(data.userId);
        setSuccess('OTP sent to your email. Please check your inbox.');
        setMode('otp_verify');
      } else if (mode === 'otp_verify') {
        const res = await fetch(`${getApiUrl()}/api/auth/login/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, otp: form.otp }),
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
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      
      {/* Decorative background shapes */}
      <div className="hidden sm:block absolute top-10 left-10 w-20 h-20 bg-mint rounded-full border-3 border-ink animate-float"></div>
      <div className="hidden sm:block absolute bottom-20 right-10 w-16 h-16 bg-sunny border-3 border-ink rotate-12 animate-wiggle"></div>
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="neo-card card-purple p-6 sm:p-8"
        >
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-black text-ink flex justify-center items-center gap-1">
                IRIS Bot <span className="text-iris-purple">✦</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink">Welcome back</h1>
            <p className="text-ink/60 font-medium text-sm sm:text-base mt-1">
              {mode === 'password' ? 'Sign in to access your dashboard' : mode === 'otp_request' ? 'Passwordless Login / Forgot Password' : 'Enter OTP to Login'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-coral/20 border-3 border-coral text-coral font-bold text-sm text-center rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-mint/20 border-3 border-mint text-ink font-bold text-sm text-center rounded-xl">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
            {(mode === 'password' || mode === 'otp_request') && (
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-ink/70 uppercase tracking-widest mb-1">
                  <RiMailLine className="w-4 h-4" /> Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="input-brutal text-base py-3 px-4"
                  placeholder="student@university.edu"
                />
              </div>
            )}

            {mode === 'password' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-ink/70 uppercase tracking-widest mb-1">
                  <RiLockLine className="w-4 h-4" /> Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  className="input-brutal text-base py-3 px-4"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => { setMode('otp_request'); setError(''); setSuccess(''); }}
                  className="mt-2 text-xs text-iris-purple hover:text-ink font-bold underline decoration-2 underline-offset-4"
                >
                  Forgot Password? Login with OTP
                </button>
              </div>
            )}

            {mode === 'otp_verify' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-ink/70 uppercase tracking-widest mb-2">
                  <RiShieldCheckLine className="w-4 h-4" /> OTP Code
                </label>
                <input
                  type="text"
                  value={form.otp}
                  onChange={e => setForm(p => ({ ...p, otp: e.target.value }))}
                  required
                  maxLength={6}
                  className="input-brutal tracking-[12px] font-mono text-center text-xl"
                  placeholder="123456"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary justify-center text-lg mt-4"
            >
              {loading ? <RiLoader4Line className="animate-spin w-6 h-6" /> : (
                <>
                  {mode === 'password' ? 'Sign In' : mode === 'otp_request' ? 'Send OTP' : 'Verify & Login'} 
                  <RiArrowRightLine className="w-5 h-5" />
                </>
              )}
            </button>

            {mode !== 'password' && (
              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); setSuccess(''); }}
                className="text-xs text-gray-400 hover:text-white font-bold underline decoration-2 underline-offset-4 text-center mt-2"
              >
                Back to Password Login
              </button>
            )}
          </form>

          <div className="mt-8 text-center text-sm font-medium text-ink/70 border-t-2 border-ink/10 pt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-iris-purple hover:text-ink font-bold underline decoration-2 underline-offset-4 transition-colors">
              Register here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
