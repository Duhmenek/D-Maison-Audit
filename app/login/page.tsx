'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      if (res.ok) {
        router.push('/dashboard/jnt-reconciliation');
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-black text-slate-900 tracking-widest uppercase">DD-MAISON</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Access Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enter Access Code</label>
            <input 
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#947a46] focus:outline-none font-mono text-center tracking-[0.5em] transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Unlock System'}
          </button>
        </form>

        <p className="text-center text-[8px] text-slate-300 font-bold uppercase tracking-widest">
          Authorized Personnel Only • Session will be logged
        </p>
      </motion.div>
    </div>
  );
}
