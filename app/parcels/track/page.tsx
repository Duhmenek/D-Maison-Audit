'use client';

import { useState } from 'react';
import { EXPECTED_PARCELS, Parcel } from '../../lib/data';

export default function ParcelTracking() {
  const [searchInvoice, setSearchInvoice] = useState('');
  const [trackingResult, setTrackingResult] = useState<Parcel | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInvoice) return;

    const result = EXPECTED_PARCELS.find(p => p.trackingNumber.toUpperCase() === searchInvoice.toUpperCase());
    
    if (result) {
      setTrackingResult(result);
      setNotFound(false);
    } else {
      setTrackingResult(null);
      setNotFound(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_BUILDING': return '🏢';
      case 'SCHEDULED_FOR_PICKUP': return '📅';
      case 'OUT_FOR_DELIVERY': return '🚚';
      case 'DELIVERED': return '✅';
      default: return '📦';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="bg-[#5e6c37] p-10 rounded-3xl shadow-2xl text-white space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter">PARCEL TRACKING</h1>
            <p className="text-[#d9e3bc] font-medium">Real-time Status & Handover Verification</p>
          </div>
          <form onSubmit={handleTrack} className="flex gap-4">
            <input 
              type="text"
              placeholder="Enter 6-Digit Invoice (e.g., 157856)"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              className="flex-1 px-6 py-4 rounded-2xl bg-white text-slate-900 text-lg font-bold shadow-lg focus:outline-none focus:ring-4 focus:ring-[#d9e3bc] transition-all"
            />
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-colors shadow-xl">
              Lookup
            </button>
          </form>
        </div>

        {/* Results Area */}
        {trackingResult ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Invoice Number</div>
                   <div className="bg-red-50 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                     VERIFIED BY J&T
                   </div>
                </div>
                <div className="text-3xl font-black text-[#5e6c37]">{trackingResult.trackingNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Destination</div>
                <div className="text-xl font-bold text-slate-800">{trackingResult.destination}</div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Status Timeline */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Status History</h3>
                <div className="relative border-l-2 border-[#d9e3bc] ml-4 pl-8 space-y-10">
                  {/* Current/Latest Status */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-[#5e6c37] flex items-center justify-center text-sm shadow-lg shadow-[#d9e3bc]">
                      {getStatusIcon(trackingResult.status)}
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-800">{trackingResult.status.replace(/_/g, ' ')}</div>
                      <div className="text-xs font-bold text-[#5e6c37]">TODAY | {new Date().toLocaleTimeString()}</div>
                      <p className="text-sm text-slate-500 mt-1">Parcel has reached this checkpoint successfully.</p>
                    </div>
                  </div>

                  {/* Previous State Mockup */}
                  <div className="relative opacity-40">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                      📦
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-400 italic underline decoration-[#d9e3bc]">Previous Checkpoint</div>
                      <div className="text-xs font-medium text-slate-400">ARCHIVED LOG ENTRY</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courier/Batch Details */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Handover Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 text-sm">Courier Name:</span>
                    <span className="font-bold text-slate-800">{trackingResult.courierName || "TBA"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 text-sm">Manifest Batch ID:</span>
                    <span className="font-mono text-xs font-black bg-slate-200 px-2 py-1 rounded">
                      {trackingResult.batchId || "UNASSIGNED"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 text-sm">Scheduled Date:</span>
                    <span className="font-bold text-slate-800">{trackingResult.scheduledAt || "N/A"}</span>
                  </div>
                </div>
                
                {trackingResult.status === 'OUT_FOR_DELIVERY' && (
                  <div className="bg-green-100 p-4 rounded-xl border border-green-200 mt-6">
                    <div className="text-xs font-black text-green-700 uppercase">Verification Status</div>
                    <div className="text-sm text-green-800 font-bold mt-1">✓ Handover to Driver Confirmed</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : notFound ? (
          <div className="bg-red-50 p-20 rounded-3xl border-2 border-red-100 text-center space-y-4">
            <div className="text-6xl">🔍❌</div>
            <h2 className="text-2xl font-black text-red-700">INVOICE NOT FOUND</h2>
            <p className="text-red-600">Please check the invoice number and try again. Ensure there are no spaces.</p>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl opacity-30">
            <div className="text-6xl">📋</div>
            <h2 className="text-xl font-bold italic tracking-tighter">Enter an invoice to see the audit trail.</h2>
          </div>
        )}
      </div>
    </main>
  );
}
