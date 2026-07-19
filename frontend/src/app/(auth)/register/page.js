'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiUserLine, RiMailLine, RiLockLine, RiArrowRightLine, RiLoader4Line } from 'react-icons/ri';
import { getApiUrl } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      if (data.userId) {
        router.push(`/verify-otp?userId=${data.userId}`);
      } else {
        router.push('/login');
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
      <div className="hidden sm:block absolute top-12 right-10 w-20 h-20 bg-coral border-3 border-ink animate-float" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
      <div className="hidden sm:block absolute bottom-10 left-10 w-16 h-16 bg-sky border-3 border-ink animate-wiggle"></div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="neo-card card-sunny p-6 sm:p-8 relative"
        >
          {/* Playful sticker */}
          <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-5 rotate-12">
            <span className="tag-sticker bg-mint border-3 shadow-[2px_2px_0_#1A1A2E] text-sm sm:text-lg font-caveat px-3 py-1">
              Join IRIS Bot! ✦
            </span>
          </div>

          <div className="mb-6 text-center">
            <Link href="/" className="inline-block mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-black text-ink flex justify-center items-center gap-1">
                IRIS Bot <span className="text-iris-purple">✦</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-ink">Create Account</h1>
            <p className="text-ink/60 font-medium text-sm sm:text-base mt-1">Start learning smarter today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-coral/20 border-3 border-coral text-coral font-bold text-sm text-center rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-ink/70 uppercase tracking-widest mb-1">
                <RiUserLine className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                className="input-brutal text-base py-3 px-4"
                placeholder="John Doe"
              />
            </div>

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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary justify-center text-base sm:text-lg py-3 mt-2"
            >
              {loading ? <RiLoader4Line className="animate-spin w-6 h-6" /> : (
                <>Sign Up <RiArrowRightLine className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm font-medium text-ink/70 border-t-2 border-ink/10 pt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-iris-purple hover:text-ink font-bold underline decoration-2 underline-offset-4 transition-colors">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
