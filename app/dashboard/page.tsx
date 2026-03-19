'use client';

import { useState, useMemo } from 'react';
import { EXPECTED_PARCELS } from '@/app/lib/data';

interface AuditMatch {
  invoiceNumber: string;
  customerName: string;
  orNumber: string;
  status: 'received' | 'missing';
}

export default function Dashboard() {
  // --- Dashboard Stats ---
  const stats = [
    { name: 'Total Inventory Value', value: '$1,284,000', change: '+2.5%', icon: (
      <svg className="w-6 h-6 text-[#947a46]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ) },
    { name: 'Active Repair Tickets', value: '24', change: '4 Ready', icon: (
      <svg className="w-6 h-6 text-[#947a46]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
    ) },
    { name: 'Monthly Sales Revenue', value: '$342,500', change: '+12%', icon: (
      <svg className="w-6 h-6 text-[#947a46]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
    ) },
    { name: 'Inventory Count Status', value: '98.2%', change: 'Last count: 2d ago', icon: (
      <svg className="w-6 h-6 text-[#947a46]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
    ) },
  ];

  // --- Reconciliation State ---
  const [manifestInput, setManifestInput] = useState('');
  const [receivingInput, setReceivingInput] = useState('');

  const reconciliation = useMemo(() => {
    const linesA = manifestInput.split('\n').filter(l => l.trim() !== '');
    const manifestData = linesA.map(line => {
      const parts = line.split(/[\t,]/);
      const invoice = parts[0]?.trim();
      let name = parts[1]?.trim();
      if (invoice && !name) {
        const found = EXPECTED_PARCELS.find(p => p.trackingNumber === invoice);
        name = found ? found.recipient : 'Unknown Client';
      }
      return { invoice, name: name || 'Unknown Client' };
    });

    const linesB = receivingInput.split('\n').filter(l => l.trim() !== '');
    const receivingData = linesB.map(line => {
      const parts = line.split(/[\t,]/);
      return { invoice: parts[0]?.trim(), orNumber: parts[1]?.trim() || 'Pending...' };
    });

    const matched: AuditMatch[] = [];
    const missing: AuditMatch[] = [];

    manifestData.forEach(m => {
      if (!m.invoice) return;
      const recv = receivingData.find(r => r.invoice === m.invoice);
      if (recv) {
        matched.push({ invoiceNumber: m.invoice, customerName: m.name, orNumber: recv.orNumber, status: 'received' });
      } else {
        missing.push({ invoiceNumber: m.invoice, customerName: m.name, orNumber: '-', status: 'missing' });
      }
    });

    return { matched, missing, prepared: manifestData.length, scanned: receivingData.length };
  }, [manifestInput, receivingInput]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Executive Overview</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">D-Maison Real-time Analytics Dashboard</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            Export Report
          </button>
          <button className="px-5 py-2.5 bg-[#947a46] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-yellow-900/10">
            Create Sale
          </button>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#947a4610] transition-colors">
                {stat.icon}
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                stat.change.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
            <h3 className="text-2xl font-black text-[#0f172a]">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* RECONCILIATION HUB SECTION */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Reconciliation Hub</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Logistics & Parcel Handover Audit</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">Success Rate</p>
              <p className="text-lg font-black text-emerald-600">
                {reconciliation.prepared > 0 ? Math.round((reconciliation.matched.length / reconciliation.prepared) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Input A: Outgoing Manifest</label>
              <textarea 
                value={manifestInput}
                onChange={(e) => setManifestInput(e.target.value)}
                placeholder="Paste Invoice Numbers and Names..."
                className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#947a46] focus:outline-none font-mono text-xs transition-all shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Input B: J&T Receiving Log</label>
              <textarea 
                value={receivingInput}
                onChange={(e) => setReceivingInput(e.target.value)}
                placeholder="Paste Invoice and OR Numbers..."
                className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#947a46] focus:outline-none font-mono text-xs transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Matched List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Verified Handover ({reconciliation.matched.length})
                </h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl max-h-60 overflow-y-auto shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">Invoice</th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">Client</th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">OR#</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reconciliation.matched.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30">
                        <td className="px-4 py-3 font-bold">#{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{item.customerName}</td>
                        <td className="px-4 py-3 font-mono text-[#947a46]">{item.orNumber}</td>
                      </tr>
                    ))}
                    {reconciliation.matched.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-300 italic">Waiting for scan data...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Missing List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  Missing Exception ({reconciliation.missing.length})
                </h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl max-h-60 overflow-y-auto shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">Invoice</th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">Expected Client</th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reconciliation.missing.map((item, idx) => (
                      <tr key={idx} className="bg-rose-50/10">
                        <td className="px-4 py-3 font-bold">#{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{item.customerName}</td>
                        <td className="px-4 py-3 font-black text-rose-500">NOT SCANNED</td>
                      </tr>
                    ))}
                    {reconciliation.missing.length === 0 && reconciliation.prepared > 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-emerald-600 font-bold uppercase">All Parcels Accounted For</td></tr>
                    )}
                    {reconciliation.prepared === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-300 italic">No manifest loaded...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Existing Charts and Repairs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Recent Sales Performance</h2>
            <div className="flex space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#947a46]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
            </div>
          </div>
          <div className="h-80 bg-slate-50/50 flex items-center justify-center p-8">
             <p className="text-slate-300 text-xs font-black uppercase tracking-widest italic">Live Sales Chart Visualization</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Priority Repairs</h2>
          </div>
          <div className="p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Rolex Submariner</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calibration • Ref #82{i}9</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-[#947a46] uppercase border border-[#947a4640] px-2 py-0.5 rounded">Urgent</span>
              </div>
            ))}
          </div>
          <button className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-50 hover:bg-slate-50 transition-colors">
            View All Work Orders
          </button>
        </div>
      </div>
    </div>
  );
}
