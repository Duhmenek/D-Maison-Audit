'use client';

import { useState, useRef, useEffect } from 'react';
import { Parcel, EXPECTED_PARCELS } from '../lib/data';

export default function ParcelAudit() {
  const [scanValue, setScanValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastParcel, setLastParcel] = useState<Parcel | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedList, setVerifiedList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: scanValue.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setLastParcel(data.parcel);
        setErrorMessage('');
        if (!verifiedList.includes(data.parcel.trackingNumber)) {
          setVerifiedList((prev) => [...prev, data.parcel.trackingNumber]);
        }
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Verification Failed');
        setLastParcel(null);
      }
    } catch (error) {
      console.error('Scan Error:', error);
      setStatus('error');
      setErrorMessage('Server Error');
    }

    setScanValue('');
    setTimeout(() => {
      inputRef.current?.focus();
      if (status !== 'idle') {
         setTimeout(() => setStatus('idle'), 3000);
      }
    }, 100);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-[#5e6c37]">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parcel Audit</h1>
            <p className="text-gray-500 italic">Ensuring Correct Parcel Pickup</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Audit Status</div>
            <div className={`text-xl font-bold ${verifiedList.length === EXPECTED_PARCELS.length ? 'text-green-600' : 'text-orange-600'}`}>
              {verifiedList.length} / {EXPECTED_PARCELS.length} Parcels
            </div>
          </div>
        </header>

        {/* Scan Input Area */}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
          <h2 className="text-lg font-medium text-gray-600">Scan Parcel Barcode</h2>
          <form onSubmit={handleScan}>
            <input
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              placeholder="Waiting for scan..."
              className="w-full max-w-md px-6 py-4 text-2xl border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#5e6c37] text-center transition-colors bg-white text-black"
              autoFocus
            />
            <button type="submit" className="hidden">Verify</button>
          </form>
        </div>

        {/* Status Indicator */}
        <div className={`p-10 rounded-2xl border-4 transition-all duration-300 text-center ${
          status === 'success' ? 'bg-green-50 border-green-500 scale-105 shadow-green-100' :
          status === 'error' ? 'bg-red-50 border-red-500 scale-105 shadow-red-100' :
          'bg-white border-transparent'
        }`}>
          {status === 'success' && lastParcel && (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">✅</div>
              <h2 className="text-4xl font-black text-green-700">CORRECT PARCEL</h2>
              <div className="text-xl text-gray-700">
                <span className="font-bold">{lastParcel.trackingNumber}</span> | {lastParcel.recipient} ({lastParcel.destination})
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">❌</div>
              <h2 className="text-4xl font-black text-red-700">INVALID PARCEL</h2>
              <p className="text-xl text-red-600 font-medium">{errorMessage}</p>
            </div>
          )}
          {status === 'idle' && (
             <div className="text-gray-300 py-10">
               <div className="text-4xl opacity-20">Waiting for Data...</div>
             </div>
          )}
        </div>

        {/* Audit Log / List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gray-100 border-b font-bold text-gray-700 uppercase text-sm tracking-widest">Expected Pickup List</div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-bold uppercase">
                <th className="px-6 py-3">Tracking #</th>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {EXPECTED_PARCELS.map((p) => (
                <tr key={p.trackingNumber} className={`transition-colors ${verifiedList.includes(p.trackingNumber) ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 font-mono font-medium">{p.trackingNumber}</td>
                  <td className="px-6 py-4">{p.recipient}</td>
                  <td className="px-6 py-4">
                    {verifiedList.includes(p.trackingNumber) ? (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">PICKED UP</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs font-bold rounded-full">PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
