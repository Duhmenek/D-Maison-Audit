'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CEO' | 'AUDITOR'>('AUDITOR');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate Authentication
    if (email && password) {
      // Store mock user in local storage
      localStorage.setItem('user', JSON.stringify({ email, role }));
      
      // Redirect based on role
      if (role === 'CEO') {
        router.push('/revenue'); // CEOs usually go to the financial dashboard
      } else {
        router.push('/parcels'); // Auditors usually go to logistics tracking
      }
    } else {
      alert("Please enter credentials");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#5e6c37] p-8 text-center">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">AUDIT PRO</h1>
          <p className="text-[#d9e3bc] text-sm mt-1 uppercase font-bold tracking-widest">Integrated Control System</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Access Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setRole('AUDITOR')}
                className={`py-3 rounded-xl font-bold border-2 transition-all ${
                  role === 'AUDITOR' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                Auditor
              </button>
              <button 
                type="button"
                onClick={() => setRole('CEO')}
                className={`py-3 rounded-xl font-bold border-2 transition-all ${
                  role === 'CEO' ? 'border-[#5e6c37] bg-[#5e6c37] text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                CEO
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5e6c37] font-medium"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5e6c37] font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200"
          >
            Authenticate Access
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or Quick Access</span></div>
          </div>

          <button 
            type="button"
            onClick={() => router.push('/parcels/track')}
            className="w-full border-2 border-[#5e6c37] text-[#5e6c37] py-4 rounded-xl font-black text-lg hover:bg-[#5e6c37] hover:text-white transition-all shadow-sm"
          >
            Track a Parcel
          </button>
          
          <p className="text-center text-xs text-slate-400">
            Authorized Personnel Only. All activities are logged for auditing purposes.
          </p>
        </form>
      </div>
    </main>
  );
}
