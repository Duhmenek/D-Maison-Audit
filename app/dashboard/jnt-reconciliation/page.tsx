'use client';

import { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

interface ManifestItem {
  invoiceNumber: string;
  customerName: string;
  scanned: boolean;
  scanTime?: string;
  isDuplicate?: boolean;
}

export default function JntReconciliation() {
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<'google' | 'onedrive' | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // High Performance: Use deferred value for filtering/search if needed
  const deferredManifest = useDeferredValue(manifest);

  // Load persistent data from SQLite on mount
  const loadPersistentData = async () => {
    try {
      const res = await fetch('/api/sync/sheets'); // Primary source
      const result = await res.json();
      if (result.success && result.data) {
        const formatted = result.data.map((item: any) => ({
          invoiceNumber: item.invoice_number,
          customerName: item.customer_name,
          scanned: item.status === 'VERIFIED',
          scanTime: item.scanned_at,
          isDuplicate: !!item.is_duplicate
        }));
        setManifest(formatted);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  useEffect(() => {
    loadPersistentData();

    // Setup Auto-Sync Polling (every 30 seconds)
    const interval = setInterval(loadPersistentData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 1. Manual Sync with Google Sheets or OneDrive
  const syncData = async (source: 'google' | 'onedrive') => {
    setIsSyncing(true);
    setSyncSource(source);
    const endpoint = source === 'google' ? '/api/sync/sheets' : '/api/sync/onedrive';
    
    try {
      const res = await fetch(endpoint);
      const result = await res.json();
      if (result.success) {
        const formatted = result.data.map((item: any) => ({
          invoiceNumber: item.invoice_number,
          customerName: item.customer_name,
          scanned: item.status === 'VERIFIED',
          scanTime: item.scanned_at,
          isDuplicate: !!item.is_duplicate
        }));
        setManifest(formatted);
      } else {
        alert(result.error || `Sync from ${source} failed.`);
      }
    } catch (error) {
      alert(`Network error during ${source} sync.`);
    } finally {
      setIsSyncing(false);
      setSyncSource(null);
    }
  };

  // 2. High Performance Scan/Type Event
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = scanInput.trim().toLowerCase();
    
    if (!input) return;

    // Fast local check
    const index = manifest.findIndex(item => 
      item.invoiceNumber.toLowerCase() === input || 
      item.customerName.toLowerCase().includes(input)
    );
    
    if (index !== -1) {
      const matchedItem = manifest[index];
      const scanTime = new Date().toLocaleTimeString();
      
      // 1. Update Persistent Storage (Fire & Forget for speed)
      fetch('/api/sync/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: matchedItem.invoiceNumber,
          status: 'VERIFIED',
          scanTime: scanTime
        })
      });

      // 2. Update Local State (Immediate)
      const updatedManifest = [...manifest];
      updatedManifest[index] = { 
        ...updatedManifest[index], 
        scanned: true,
        scanTime: scanTime
      };
      
      setManifest(updatedManifest);
      setLastScanned(`${matchedItem.customerName} - #${matchedItem.invoiceNumber}`);
      setScanInput('');

      // 3. Smooth Auto-scroll
      const element = document.getElementById(`invoice-${matchedItem.invoiceNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Logic: If invoice number already exists in the sheet, the system should highlight it as a duplicate
      // (This is handled by the `isDuplicate` flag from the server sync)
      alert(`No record found for "${scanInput}". Please check the manifest.`);
      setScanInput('');
    }
  };

  const stats = {
    total: manifest.length,
    scanned: manifest.filter(m => m.scanned).length,
    remaining: manifest.filter(m => !m.scanned).length,
    duplicates: manifest.filter(m => m.isDuplicate).length
  };

  const toggleZoom = () => {
    setZoomLevel(prev => prev === 1 ? 1.25 : 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">J&T <span className="text-rose-500">Google Sync Hub</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">High-Speed Cloud Integration Protocol</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={toggleZoom}
            className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            🔍 Zoom {zoomLevel === 1 ? 'In' : 'Out'}
          </button>
          <button 
            onClick={() => syncData('google')}
            disabled={isSyncing}
            className={`px-6 py-2 ${isSyncing && syncSource === 'google' ? 'bg-slate-200' : 'bg-[#947a46]'} text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#947a4620] transition-all flex items-center gap-2`}
          >
            {isSyncing && syncSource === 'google' ? '🔄 Syncing...' : '☁️ Google Sheets'}
          </button>
          <button 
            onClick={() => syncData('onedrive')}
            disabled={isSyncing}
            className={`px-6 py-2 ${isSyncing && syncSource === 'onedrive' ? 'bg-slate-200' : 'bg-blue-600'} text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2`}
          >
            {isSyncing && syncSource === 'onedrive' ? '🔄 Syncing...' : '📁 OneDrive Excel'}
          </button>
        </div>
      </header>

      {/* Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Live Scanner (Zero-Lag)</label>
              <form onSubmit={handleScan}>
                <input 
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or Type Invoice #..."
                  className="w-full px-5 py-4 bg-rose-50 border-2 border-rose-100 rounded-2xl focus:border-rose-500 focus:outline-none font-mono text-sm font-black transition-all"
                  autoFocus
                />
              </form>
              <p className="text-[9px] text-slate-400 italic">Persistent data saved automatically</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StatCard label="Cloud Records" value={stats.total} color="slate" />
            <StatCard label="Verified" value={stats.scanned} color="emerald" />
            <StatCard label="Pending" value={stats.remaining} color="rose" />
            {stats.duplicates > 0 && <StatCard label="Duplicates" value={stats.duplicates} color="amber" />}
          </div>
        </div>

        {/* Live Table Area */}
        <motion.div 
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformOrigin: 'top right' }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[700px] will-change-transform"
        >
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Verification Table</h3>
            {lastScanned && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-emerald-600 uppercase">Last Scanned: #{lastScanned}</p>
              </motion.div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">Invoice Number</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">Customer Name</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                <AnimatePresence mode="popLayout">
                  {deferredManifest.map((item) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={item.invoiceNumber}
                      id={`invoice-${item.invoiceNumber}`}
                      className={`transition-colors duration-500 ${
                        item.isDuplicate ? 'bg-amber-50/50' : 
                        item.scanned ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm font-black ${item.scanned ? 'text-emerald-700' : 'text-slate-900'}`}>
                            #{item.invoiceNumber}
                          </span>
                          {item.isDuplicate && (
                            <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm">
                              Duplicate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-bold uppercase tracking-tight ${item.scanned ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {item.customerName}
                        </p>
                        {item.scanTime && <p className="text-[8px] text-emerald-400 font-bold">Scanned at {item.scanTime}</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.scanned ? (
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                            Verified
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                            Pending
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {manifest.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-32 text-center">
                      <div className="space-y-2 opacity-30">
                        <p className="text-2xl">☁️</p>
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Google Sheets Sync</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'slate' }: any) {
  const styles: any = {
    slate: 'bg-white border-slate-100 text-slate-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900'
  };
  return (
    <div className={`p-6 rounded-3xl border-2 shadow-sm ${styles[color]} flex justify-between items-center`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-2xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}
