'use client';

import { useState } from 'react';
import { EXPECTED_PARCELS, Parcel } from '../../lib/data';

export default function PickupManagement() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [courierName, setCourierName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter for parcels currently "In Building"
  const inBuildingParcels = EXPECTED_PARCELS.filter(p => p.status === 'IN_BUILDING');

  const toggleSelect = (invoice: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoice) ? prev.filter(i => i !== invoice) : [...prev, invoice]
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoices.length === 0 || !courierName || !scheduledDate) {
      alert("Please select parcels and provide courier details.");
      return;
    }

    setIsProcessing(true);
    
    // API Call Mockup
    setTimeout(() => {
      alert(`Manifest Created!\nBatch ID: MNF-${Date.now()}\nCourier: ${courierName}\nInvoices: ${selectedInvoices.join(', ')}`);
      setSelectedInvoices([]);
      setCourierName('');
      setScheduledDate('');
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight underline decoration-[#5e6c37] decoration-4">Courier Coordination</h1>
            <p className="text-slate-500">Pickup Scheduling & Invoice Batching Control</p>
          </div>
          <div className="bg-[#5e6c37] px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md">
            Scheduled: {selectedInvoices.length} Parcels
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Parcel Selection List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 uppercase text-xs tracking-widest flex justify-between">
              <span>Parcels "In Building"</span>
              <span>Available: {inBuildingParcels.length}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 font-bold uppercase border-b">
                  <th className="px-6 py-4">Select</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inBuildingParcels.map((p) => (
                  <tr key={p.trackingNumber} className={`hover:bg-slate-50 transition-colors ${selectedInvoices.includes(p.trackingNumber) ? 'bg-[#d9e3bc]' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedInvoices.includes(p.trackingNumber)}
                        onChange={() => toggleSelect(p.trackingNumber)}
                        className="w-5 h-5 accent-[#5e6c37]"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[#5e6c37]">{p.trackingNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scheduling Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-[#5e6c37] space-y-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Create Pickup Manifest</h3>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courier Partner</label>
                  <select 
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5e6c37] outline-none font-bold"
                  >
                    <option value="">Select Courier</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL Express</option>
                    <option value="Local Courier">Local Direct</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Pickup Date</label>
                  <input 
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5e6c37] outline-none font-bold"
                  />
                </div>
                
                <div className="p-4 bg-[#f9f9f2] rounded-xl border border-[#d9e3bc]">
                  <p className="text-xs text-slate-500 leading-tight">
                    By confirming, these invoices will move to <span className="text-[#5e6c37] font-bold">SCHEDULED FOR PICKUP</span> and be assigned a unique Batch ID.
                  </p>
                </div>

                <button 
                  disabled={isProcessing || selectedInvoices.length === 0}
                  className="w-full bg-[#5e6c37] text-white py-4 rounded-xl font-black shadow-xl shadow-[#d9e3bc] hover:bg-[#4a552b] transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Generating Batch..." : "Schedule Bulk Pickup"}
                </button>
              </form>
            </div>
            
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status Overview</div>
              <div className="text-2xl font-black italic">Batch Handover</div>
              <button className="mt-4 w-full bg-white text-slate-900 py-2 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors uppercase">
                Confirm Arrival & Handover
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
