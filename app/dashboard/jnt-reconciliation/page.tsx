'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

interface ManifestItem {
  invoiceNumber: string;
  customerName: string;
  scanned: boolean;
  scanTime?: string;
  isDuplicate?: boolean;
}

const STAFF_LIST = ['Dom', 'Pao', 'Blythe', 'May'];

export default function JntReconciliation() {
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [staffName, setStaffName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [highlightedInvoice, setHighlightedInvoice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlash, setShowFlash] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load persistence and setup
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    
    const savedStaff = localStorage.getItem('jnt_active_staff');
    if (savedStaff && STAFF_LIST.includes(savedStaff)) {
      setStaffName(savedStaff);
      setIsSessionLocked(true);
    }
  }, []);

  // Auto-focus input when session is locked or after scan
  useEffect(() => {
    if (isSessionLocked) {
      inputRef.current?.focus();
    }
  }, [isSessionLocked, lastScanned]);

  const filteredManifest = useMemo(() => {
    let list = manifest;
    if (activeFilter === 'VERIFIED') list = list.filter(item => item.scanned);
    if (activeFilter === 'PENDING') list = list.filter(item => !item.scanned);

    const search = scanInput.toLowerCase().trim();
    if (!search || search.includes('\n') || search.includes('\t')) return list;
    
    return list.filter(item => 
      item.invoiceNumber.toLowerCase().includes(search) || 
      item.customerName.toLowerCase().includes(search)
    );
  }, [manifest, scanInput, activeFilter]);

  // Auto-verify on exact 12-digit match
  useEffect(() => {
    const input = scanInput.trim().toLowerCase();
    if (input.length === 12 && !input.includes('\n')) {
      const match = manifest.find(item => item.invoiceNumber.toLowerCase() === input);
      if (match && !match.scanned) {
        verifyInvoice(match);
      }
    }
  }, [scanInput, manifest]);

  const loadPersistentData = async () => {
    try {
      const res = await fetch('/api/sync/sheets');
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
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadPersistentData();
    const interval = setInterval(loadPersistentData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = () => {
    if (staffName) {
      setIsSessionLocked(true);
      localStorage.setItem('jnt_active_staff', staffName);
      inputRef.current?.focus();
    } else {
      alert('Please select a staff member first.');
    }
  };

  const handleSwitchStaff = () => {
    setIsSessionLocked(false);
    localStorage.removeItem('jnt_active_staff');
  };

  const verifyInvoice = async (item: ManifestItem) => {
    if (!isSessionLocked) {
      alert('Please start a session by selecting a staff member.');
      return;
    }

    const scanTime = new Date().toLocaleTimeString();
    
    setManifest(prev => prev.map(m => 
      m.invoiceNumber === item.invoiceNumber 
        ? { ...m, scanned: true, scanTime } 
        : m
    ));

    setLastScanned(`${item.customerName} - #${item.invoiceNumber}`);
    setHighlightedInvoice(item.invoiceNumber);
    setScanInput('');

    fetch('/api/sync/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: item.invoiceNumber,
        status: 'VERIFIED',
        scanTime,
        staffName,
        selectedDate
      })
    });

    setTimeout(() => setHighlightedInvoice(null), 5000);
    setTimeout(() => {
      const element = document.getElementById(`invoice-${item.invoiceNumber}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputRef.current?.focus();
    }, 100);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = scanInput.trim().toLowerCase();
    if (!input) return;

    const exactMatch = manifest.find(item => item.invoiceNumber.toLowerCase() === input);
    if (exactMatch) {
      if (exactMatch.scanned) {
        alert('Invoice already verified.');
        setScanInput('');
      } else {
        verifyInvoice(exactMatch);
      }
      return;
    }

    if (filteredManifest.length > 0) {
      const firstResult = filteredManifest[0];
      if (firstResult.scanned) {
        alert('Top result is already verified.');
        setScanInput('');
      } else {
        verifyInvoice(firstResult);
      }
    } else {
      alert(`No record found for "${scanInput}".`);
      setScanInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const extracted = data.slice(1).map(row => ({
          customerName: String(row[1] || 'Unknown').trim(),
          invoiceNumber: String(row[2] || '').trim(),
        })).filter(item => item.invoiceNumber !== '');
        await bulkSync(extracted);
      } catch (error: any) {
        alert(`Error parsing file: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Failed to read file.");
    };
    reader.readAsBinaryString(file);
  };

  const handlePasteSync = async () => {
    const lines = scanInput.split('\n').filter(l => l.trim() !== '');
    if (lines.length <= 1 && !scanInput.includes('\t')) return;

    const extracted = lines.map(line => {
      const parts = line.split(/[\t,]/);
      let p1 = parts[0]?.trim() || '';
      let p2 = parts[1]?.trim() || '';
      const isInvoice = (str: string) => str.replace(/[^0-9A-Z]/gi, '').match(/^(JT)?[0-9]{8,15}$/i);
      if (isInvoice(p2)) return { invoiceNumber: p2, customerName: p1 || 'Unknown' };
      if (isInvoice(p1)) return { invoiceNumber: p1, customerName: p2 || 'Unknown' };
      return p1 && p2 ? { invoiceNumber: p2, customerName: p1 } : null;
    }).filter(item => item !== null && item.invoiceNumber !== '');

    if (extracted.length > 0) {
      await bulkSync(extracted as any);
      setScanInput('');
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      alert('Upload cancelled.');
    }
  };

  const bulkSync = async (items: {invoiceNumber: string, customerName: string}[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();
    
    const CHUNK_SIZE = 100;
    const totalItems = items.length;
    let processedCount = 0;

    try {
      // Break into chunks for progress tracking
      for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
        if (abortControllerRef.current.signal.aborted) return;

        const chunk = items.slice(i, i + CHUNK_SIZE);
        
        const response = await fetch('/api/sync/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk, staffName, selectedDate }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`);
        }

        processedCount += chunk.length;
        setUploadProgress(Math.round((processedCount / totalItems) * 100));
      }

      await loadPersistentData();
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      alert(`Bulk sync failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleDelete = async (invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice #${invoiceNumber}?`)) return;
    
    try {
      const response = await fetch('/api/sync/sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber })
      });
      const result = await response.json();
      if (result.success) {
        setManifest(prev => prev.filter(item => item.invoiceNumber !== invoiceNumber));
      } else {
        alert('Failed to delete invoice.');
      }
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedInvoices.length} selected invoices?`)) return;

    try {
      // For simplicity in the API, we'll delete them one by one or we could update the API to handle bulk delete.
      // Let's use Promise.all to delete them in parallel.
      const deletePromises = selectedInvoices.map(invoiceNumber => 
        fetch('/api/sync/sheets', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceNumber })
        })
      );

      await Promise.all(deletePromises);
      
      setManifest(prev => prev.filter(item => !selectedInvoices.includes(item.invoiceNumber)));
      setSelectedInvoices([]);
      setIsDeleteMode(false);
    } catch (error: any) {
      alert(`Bulk delete failed: ${error.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredManifest.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredManifest.map(item => item.invoiceNumber));
    }
  };

  const toggleSelectInvoice = (invoiceNumber: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceNumber) 
        ? prev.filter(id => id !== invoiceNumber)
        : [...prev, invoiceNumber]
    );
  };

  const stats = {
    total: manifest.length,
    scanned: manifest.filter(m => m.scanned).length,
    remaining: manifest.filter(m => !m.scanned).length,
    duplicates: manifest.filter(m => m.isDuplicate).length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <AnimatePresence>
        {showFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-emerald-400 z-50 pointer-events-none" />}
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-8"
          >
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <motion.circle 
                  cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={377}
                  animate={{ strokeDashoffset: 377 - (377 * uploadProgress) / 100 }}
                  className="text-rose-500"
                />
              </svg>
              <span className="absolute text-2xl font-black text-slate-900">{uploadProgress}%</span>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Bulk Uploading</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-12 max-w-md">
                Syncing items with cloud infrastructure. Please do not close this window.
              </p>
            </div>

            <div className="w-64 bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500" 
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>

            <button 
              onClick={cancelUpload}
              className="px-8 py-3 bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
            >
              Cancel Upload
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-slate-100 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">J&T <span className="text-rose-500">Counter Checking</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">High-Speed Cloud Integration Protocol</p>
        </div>
        
        {/* Session Header */}
        <div className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${isSessionLocked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
          {!isSessionLocked ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Select Staff</label>
                <select value={staffName} onChange={(e) => setStaffName(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:border-rose-500 focus:outline-none transition-all">
                  <option value="">Choose Staff...</option>
                  {STAFF_LIST.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Select Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:border-rose-500 focus:outline-none transition-all" />
              </div>
              <button onClick={handleStartSession} className="mt-4 px-6 py-2 bg-[#947a46] text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:scale-105 transition-all">Start Session</button>
            </>
          ) : (
            <div className="flex items-center gap-6 w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs animate-pulse">✓</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operator</p>
                  <p className="text-sm font-black text-emerald-700 uppercase">{staffName}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-emerald-200 hidden md:block" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Date</p>
                <p className="text-xs font-black text-slate-700 uppercase">{selectedDate}</p>
              </div>
              <button onClick={handleSwitchStaff} className="ml-auto px-4 py-1.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">Switch Staff</button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => document.getElementById('fileUpload')?.click()} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2">
            📁 Upload Excel
            <input id="fileUpload" type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </button>
          
          <button 
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setSelectedInvoices([]);
            }} 
            className={`p-3 rounded-xl shadow-lg transition-all flex items-center justify-center ${isDeleteMode ? 'bg-red-500 text-white ring-4 ring-red-100' : 'bg-white text-slate-600 border border-slate-200 hover:text-red-500'}`}
            title={isDeleteMode ? "Cancel Deletion" : "Toggle Delete Mode"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>

          {isDeleteMode && (
            <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
              >
                {selectedInvoices.length === filteredManifest.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedInvoices.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-700 transition-all shadow-md"
                >
                  Delete Selected ({selectedInvoices.length})
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className={`bg-white p-8 rounded-3xl border-2 transition-all duration-500 ${isSessionLocked ? 'border-emerald-200 shadow-emerald-100 shadow-2xl' : 'border-slate-100 shadow-sm opacity-50 pointer-events-none'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Input</p>
                {isSessionLocked && <span className="text-[9px] font-black text-emerald-500 animate-pulse uppercase">Active Session</span>}
              </div>
              <form onSubmit={handleScan} className="space-y-4">
                <textarea 
                  ref={inputRef}
                  rows={4} 
                  value={scanInput} 
                  onChange={(e) => setScanInput(e.target.value)} 
                  placeholder={isSessionLocked ? "Scan or Search Invoice" : "Select staff to start scanning"}
                  disabled={!isSessionLocked}
                  className="w-full px-5 py-4 bg-rose-50 border-2 border-rose-100 rounded-2xl focus:border-rose-500 focus:outline-none font-mono text-sm font-black transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleScan(e);
                    }
                  }}
                />
              </form>
              <p className="text-[9px] text-slate-400 italic font-bold uppercase tracking-widest">Rapid-fire scanning enabled. Focus remains here.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <StatCard label="Cloud Records" value={stats.total} color="slate" onClick={() => setActiveFilter('ALL')} active={activeFilter === 'ALL'} />
            <StatCard label="Verified" value={stats.scanned} color="emerald" onClick={() => setActiveFilter('VERIFIED')} active={activeFilter === 'VERIFIED'} />
            <StatCard label="Pending" value={stats.remaining} color="rose" onClick={() => setActiveFilter('PENDING')} active={activeFilter === 'PENDING'} />
            {stats.duplicates > 0 && <StatCard label="Duplicates" value={stats.duplicates} color="amber" />}
          </div>
        </div>

        <motion.div animate={{ scale: zoomLevel }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Verification Table</h3>
            {lastScanned && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
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
                {filteredManifest.map((item) => (
                  <tr 
                    key={item.invoiceNumber} 
                    id={`invoice-${item.invoiceNumber}`} 
                    onClick={() => isDeleteMode && toggleSelectInvoice(item.invoiceNumber)}
                    className={`transition-all duration-300 ${isDeleteMode ? 'cursor-pointer' : ''} ${selectedInvoices.includes(item.invoiceNumber) ? 'bg-red-50 ring-2 ring-red-300' : highlightedInvoice === item.invoiceNumber ? 'bg-emerald-100 ring-2 ring-emerald-400 z-10' : item.isDuplicate ? 'bg-amber-50/50' : item.scanned ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isDeleteMode && (
                          <input 
                            type="checkbox" 
                            checked={selectedInvoices.includes(item.invoiceNumber)}
                            onChange={() => toggleSelectInvoice(item.invoiceNumber)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                          />
                        )}
                        <span className={`font-mono text-sm font-black ${item.scanned ? 'text-emerald-700' : 'text-slate-900'}`}>#{item.invoiceNumber}</span>
                        {item.isDuplicate && <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm">Duplicate</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-bold uppercase tracking-tight ${item.scanned ? 'text-emerald-600' : 'text-slate-500'}`}>{item.customerName}</p>
                      {item.scanTime && <p className="text-[8px] text-emerald-400 font-bold">Scanned at {item.scanTime}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.scanned ? <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Verified</span> : <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'slate', onClick, active }: any) {
  const styles: any = {
    slate: active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-900',
    emerald: active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: active ? 'bg-rose-500 border-rose-500 text-white' : 'bg-rose-50 border-rose-100 text-rose-900',
    amber: active ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-900'
  };
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-3xl border-2 shadow-sm ${styles[color]} flex justify-between items-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group`}>
      <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</p>
      <div className="flex items-center gap-3">
        <p className="text-2xl font-black italic tracking-tighter">{value}</p>
        {active && <span className="text-xs">✕</span>}
      </div>
    </button>
  );
}
