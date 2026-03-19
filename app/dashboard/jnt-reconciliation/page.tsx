'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { EXPECTED_PARCELS } from '@/app/lib/data';

interface ManifestItem {
  invoiceNumber: string;
  customerName: string;
  scanned: boolean;
  scanTime?: string;
}

export default function JntReconciliation() {
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimization: Memoize the table to prevent lag during typing
  const manifestTable = useMemo(() => {
    return manifest.map((item) => (
      <tr 
        key={item.invoiceNumber}
        id={`invoice-${item.invoiceNumber}`}
        className={`transition-all duration-300 ${item.scanned ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
      >
        <td className="px-6 py-4">
          <span className={`font-mono text-sm font-black ${item.scanned ? 'text-emerald-700' : 'text-slate-900'}`}>
            #{item.invoiceNumber}
          </span>
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
      </tr>
    ));
  }, [manifest]);

  // 1. Handle File Upload & Auto-Extraction (unchanged logic, just performance wrap)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Extract data based on user mapping: Name in Col B (1), Invoice in Col C (2)
        const newManifest: ManifestItem[] = [];
        
        data.forEach((row, index) => {
          // Skip header if it contains metadata
          const colC = String(row[2] || '').trim();
          const colB = String(row[1] || '').trim();
          
          if (index === 0 && (colC.toLowerCase().includes('invoice') || colB.toLowerCase().includes('name'))) return;
          
          if (colC && colC !== 'undefined') {
            newManifest.push({
              invoiceNumber: colC,
              customerName: colB || 'Unknown Client',
              scanned: false
            });
          }
        });

        setManifest(newManifest);
      } catch (error) {
        alert("Error reading spreadsheet. Please ensure the first column contains Invoice Numbers.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // 2. Handle Scan/Type Event (Supports Invoice OR Name)
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const input = scanInput.trim().toLowerCase();
    
    if (!input) return;

    // Search by exact Invoice # OR partial Customer Name
    const index = manifest.findIndex(item => 
      item.invoiceNumber.toLowerCase() === input || 
      item.customerName.toLowerCase().includes(input)
    );
    
    if (index !== -1) {
      const matchedItem = manifest[index];
      
      // If already scanned, just show feedback
      const updatedManifest = [...manifest];
      updatedManifest[index] = { 
        ...updatedManifest[index], 
        scanned: true,
        scanTime: updatedManifest[index].scanTime || new Date().toLocaleTimeString()
      };
      
      setManifest(updatedManifest);
      setLastScanned(`${matchedItem.customerName} - #${matchedItem.invoiceNumber}`);
      setScanInput('');

      // Auto-scroll to the item
      const element = document.getElementById(`invoice-${matchedItem.invoiceNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      alert(`No record found for "${scanInput}". Please check the manifest.`);
      setScanInput('');
    }
  };

  // 3. Download to Excel
  const downloadReport = () => {
    const exportData = manifest.map(item => ({
      'Invoice Number': item.invoiceNumber,
      'Customer Name': item.customerName,
      'Status': item.scanned ? 'RECEIVED' : 'MISSING',
      'Scan Time': item.scanTime || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Report");
    XLSX.writeFile(wb, `JNT_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = {
    total: manifest.length,
    scanned: manifest.filter(m => m.scanned).length,
    remaining: manifest.filter(m => !m.scanned).length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">J&T <span className="text-rose-500">Live Scanner Hub</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">High-Speed Parcel Verification Protocol</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setManifest([])}
            className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Clear Hub
          </button>
          <button 
            onClick={downloadReport}
            disabled={manifest.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-50 hover:bg-emerald-700 transition-all"
          >
            📥 Download Audit Report
          </button>
        </div>
      </header>

      {/* Upload & Scan Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step 1: Load Manifest</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-slate-500 font-black uppercase">📁 Upload Spreadsheet</p>
                  <p className="text-[9px] text-slate-400">Excel or CSV (Col 1: Invoice)</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-50">
              <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Step 2: Start Scanning</label>
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
              <p className="text-[9px] text-slate-400 italic">Hit Enter to confirm each parcel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StatCard label="Loaded" value={stats.total} color="slate" />
            <StatCard label="Scanned" value={stats.scanned} color="emerald" />
            <StatCard label="Remaining" value={stats.remaining} color="rose" />
          </div>
        </div>

        {/* Live Table Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Verification Table</h3>
            {lastScanned && (
              <div className="flex items-center gap-2 animate-bounce">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <p className="text-[10px] font-black text-emerald-600 uppercase">Last Scanned: #{lastScanned}</p>
              </div>
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
                {manifest.map((item) => (
                  <tr 
                    key={item.invoiceNumber}
                    id={`invoice-${item.invoiceNumber}`}
                    className={`transition-all duration-500 ${item.scanned ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <span className={`font-mono text-sm font-black ${item.scanned ? 'text-emerald-700' : 'text-slate-900'}`}>
                        #{item.invoiceNumber}
                      </span>
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
                  </tr>
                ))}
                {manifest.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-32 text-center">
                      <div className="space-y-2 opacity-30">
                        <p className="text-2xl">📊</p>
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Manifest Upload</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'slate' }: any) {
  const styles: any = {
    slate: 'bg-white border-slate-100 text-slate-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-900'
  };
  return (
    <div className={`p-6 rounded-3xl border-2 shadow-sm ${styles[color]} flex justify-between items-center`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-2xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}
