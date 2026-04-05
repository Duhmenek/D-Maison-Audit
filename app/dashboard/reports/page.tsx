'use client';

import { useState } from 'react';

const inventoryToAudit = [
  { sku: 'DM-RNG-001', name: 'Diamond Solitaire Ring', status: 'IN_STOCK' },
  { sku: 'DM-WTC-042', name: 'Vintage Chronograph', status: 'IN_STOCK' },
  { sku: 'DM-RNG-022', name: 'Sapphire Eternity Band', status: 'IN_STOCK' },
  { sku: 'DM-BRC-011', name: 'Diamond Tennis Bracelet', status: 'MEMO' },
];

export default function Reports() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const toggleItem = (sku: string) => {
    setCheckedItems(prev => 
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
    );
  };

  const finishAudit = () => {
    setIsAuditing(false);
    setReportGenerated(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Audit & Reporting</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Inventory Integrity & Financial Accuracy</p>
        </div>
        {!isAuditing && (
          <button 
            onClick={() => { setIsAuditing(true); setReportGenerated(false); setCheckedItems([]); }}
            className="px-6 py-3 bg-[#947a46] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-xl shadow-yellow-900/10"
          >
            Start New Physical Audit
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {isAuditing ? (
            <div className="bg-white rounded-3xl border-2 border-[#947a46] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#947a46] p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="font-black uppercase tracking-widest text-sm">Physical Stock Count in Progress</h2>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Please verify each item in the showcase</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{checkedItems.length} / {inventoryToAudit.length}</p>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Verified</p>
                </div>
              </div>
              
              <div className="p-6 space-y-2">
                {inventoryToAudit.map((item) => (
                  <div 
                    key={item.sku}
                    onClick={() => toggleItem(item.sku)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      checkedItems.includes(item.sku) 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        checkedItems.includes(item.sku) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {checkedItems.includes(item.sku) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button 
                  onClick={finishAudit}
                  className="px-8 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                 >
                   Finalize Count & Generate Report
                 </button>
              </div>
            </div>
          ) : reportGenerated ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-in fade-in duration-500">
               <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Audit Completed Successfully</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Report Reference: AUD-2026-03-12-001</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-6 mb-8">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Expected</p>
                    <p className="text-2xl font-black text-slate-900">{inventoryToAudit.length}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Found</p>
                    <p className="text-2xl font-black text-emerald-600">{checkedItems.length}</p>
                 </div>
                 <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Discrepancy</p>
                    <p className="text-2xl font-black text-rose-600">{inventoryToAudit.length - checkedItems.length}</p>
                 </div>
               </div>
               
               <button className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                 Download Detailed Discrepancy PDF
               </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Audit Currently Active</h2>
              <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto uppercase tracking-tighter leading-relaxed">
                Start a physical audit to verify your stock levels and ensure financial accuracy.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Reporting Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Historical Accuracy</h3>
            <div className="space-y-4">
              {[
                { date: 'Feb 2026', accuracy: '99.8%', status: 'CLEAN' },
                { date: 'Jan 2026', accuracy: '98.2%', status: 'MINOR' },
                { date: 'Dec 2025', accuracy: '100%', status: 'CLEAN' },
              ].map((h) => (
                <div key={h.date} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{h.date}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Audit Score: {h.accuracy}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    h.status === 'CLEAN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
