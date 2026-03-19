'use client';

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Parcel, EXPECTED_PARCELS } from '@/app/lib/data';
import { SyncService } from '@/app/lib/sync-service';

interface AuditMatch {
  invoiceNumber: string;
  customerName: string;
  orNumber: string;
  status: 'received' | 'missing';
}

export default function AuditCenter() {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  
  // --- STATE FOR AUTO AUDIT (Original Feature) ---
  const [auditList, setAuditList] = useState<Parcel[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // --- STATE FOR MANUAL ASSISTANT (New Feature) ---
  const [manifestInput, setManifestInput] = useState('');
  const [receivingInput, setReceivingInput] = useState('');

  const log = (msg: string) => {
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // 1. AUTO AUDIT: Spreadsheet Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        const extractedInvoices = data.map((row: any) => {
          const keys = Object.keys(row);
          let invoiceKey = keys.find(k => ['invoice_no', 'invoice', 'tracking', 'order_id'].includes(k.toLowerCase().trim()));
          if (!invoiceKey && keys.length > 0) invoiceKey = keys[0];
          return invoiceKey ? String(row[invoiceKey]).trim() : '';
        }).filter(id => id !== '');

        const newAuditList = extractedInvoices.map(invoiceNo => {
          const existing = EXPECTED_PARCELS.find(p => p.trackingNumber === invoiceNo);
          return existing || { 
            trackingNumber: invoiceNo, 
            recipient: 'External / Unknown', 
            destination: 'N/A', 
            status: 'IN_BUILDING' 
          } as Parcel;
        });

        setAuditList(newAuditList);
        log(`Imported ${newAuditList.length} parcels from spreadsheet.`);
      } catch (error: any) {
        log(`Error: ${error.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const refreshAllStatuses = async () => {
    setIsSyncing(true);
    const updatedList = [...auditList];
    for (let i = 0; i < updatedList.length; i++) {
      const result = await SyncService.syncParcel(updatedList[i].trackingNumber);
      if (result) updatedList[i] = { ...result };
    }
    setAuditList(updatedList);
    setIsSyncing(false);
    log("Status synchronization complete.");
  };

  // 2. MANUAL ASSISTANT: Reconciliation Logic
  const manualReconciliation = useMemo(() => {
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
    <main className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              D-Maison <span className="text-accent">Audit Center</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Multi-Channel Reconciliation Hub</p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('MANUAL')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MANUAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Manual Assistant
            </button>
            <button 
              onClick={() => setActiveTab('AUTO')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'AUTO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Excel Auto-Audit
            </button>
          </div>
        </div>

        {activeTab === 'MANUAL' ? (
          /* --- LOGISTICS AUDIT ASSISTANT TAB --- */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Prepared" value={manualReconciliation.prepared} subtext="Manifest Total" />
              <StatCard label="Scanned" value={manualReconciliation.scanned} subtext="Log Total" />
              <StatCard label="Discrepancies" value={manualReconciliation.missing.length} subtext="Missing Parcels" color={manualReconciliation.missing.length > 0 ? 'rose' : 'emerald'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Input A: Outgoing Manifest</label>
                <textarea 
                  value={manifestInput}
                  onChange={(e) => setManifestInput(e.target.value)}
                  placeholder="Paste Invoice numbers (+ Names)..."
                  className="w-full h-48 p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-accent focus:outline-none font-mono text-xs shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Input B: Receiving Log</label>
                <textarea 
                  value={receivingInput}
                  onChange={(e) => setReceivingInput(e.target.value)}
                  placeholder="Paste Invoice numbers + OR numbers..."
                  className="w-full h-48 p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-accent focus:outline-none font-mono text-xs shadow-inner"
                />
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Verified Matches
              </h2>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-tighter">
                    <tr>
                      <th className="px-6 py-4">Invoice</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">OR Number</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {manualReconciliation.matched.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-bold">#{item.invoiceNumber}</td>
                        <td className="px-6 py-4"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">{item.customerName}</span></td>
                        <td className="px-6 py-4 font-mono text-accent font-bold">{item.orNumber}</td>
                        <td className="px-6 py-4 text-emerald-500 font-black">RECEIVED</td>
                      </tr>
                    ))}
                    {manualReconciliation.matched.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-300 italic">No data matched yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* --- EXCEL AUTO-AUDIT TAB --- */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="cursor-pointer bg-slate-900 text-white py-6 rounded-2xl font-black text-center hover:bg-slate-800 transition-all shadow-xl">
                <span>📁 Upload Master Spreadsheet</span>
                <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={refreshAllStatuses}
                disabled={isSyncing || auditList.length === 0}
                className="bg-white border-2 border-slate-900 py-6 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all"
              >
                {isSyncing ? '🔄 Syncing with Courier...' : '⚡ Bulk Status Sync'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Pending At Hub</h3>
                <div className="space-y-2">
                  {auditList.filter(p => p.status === 'IN_BUILDING').map(p => (
                    <div key={p.trackingNumber} className="bg-white p-4 rounded-xl border-l-4 border-rose-500 shadow-sm flex justify-between items-center">
                      <p className="font-bold text-xs text-slate-900">#{p.trackingNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{p.recipient}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Courier Picked Up</h3>
                <div className="space-y-2">
                  {auditList.filter(p => p.status !== 'IN_BUILDING').map(p => (
                    <div key={p.trackingNumber} className="bg-white p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm flex justify-between items-center">
                      <p className="font-bold text-xs text-slate-900">#{p.trackingNumber}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Ready for Delivery</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Debug Monitor */}
            <div className="bg-slate-900 p-6 rounded-2xl font-mono text-[10px]">
              <p className="text-accent mb-2 uppercase font-black">System Terminal</p>
              {debugLog.map((l, i) => (
                <p key={i} className="text-slate-400"><span className="text-emerald-500 mr-2">➜</span> {l}</p>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function StatCard({ label, value, subtext, color = 'slate' }: { label: string; value: string | number; subtext: string; color?: 'slate' | 'emerald' | 'rose' }) {
  const styles = {
    slate: 'bg-white text-slate-900 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    rose: 'bg-rose-50 text-rose-900 border-rose-100'
  };
  return (
    <div className={`p-6 rounded-2xl border-2 shadow-sm ${styles[color]} transition-all`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black italic tracking-tighter">{value}</p>
      <p className="text-[8px] font-bold uppercase text-slate-300 mt-1">{subtext}</p>
    </div>
  );
}
