'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Parcel, EXPECTED_PARCELS } from '@/app/lib/data';
import { SyncService } from '@/app/lib/sync-service';

export default function AuditDashboard() {
  const [spreadsheetData, setSpreadsheetData] = useState<any[]>([]);
  const [auditList, setAuditList] = useState<Parcel[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log(`[AUDIT] ${msg}`);
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // 1. Automatic Spreadsheet Scanning Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    log(`File detected: ${file.name} (${file.size} bytes)`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        log("Reading file contents...");
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        log(`Sheet found: ${wb.SheetNames[0]}`);
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        if (!data || data.length === 0) {
          log("ERROR: Spreadsheet is empty.");
          alert("The spreadsheet appears to be empty.");
          return;
        }

        log(`Parsed ${data.length} rows. Checking headers...`);
        const firstRow = data[0];
        log(`Headers found: ${Object.keys(firstRow).join(', ')}`);

        setSpreadsheetData(data);
        
        // Extract Invoice Numbers with expanded matching
        const extractedInvoices = data.map((row: any) => {
          const keys = Object.keys(row);
          // 1. Try to find a matching header
          let invoiceKey = keys.find(k => 
            ['invoice_no', 'invoice', 'invoice number', 'tracking', 'tracking_number', 'waybill', 'waybill number', 'id', 'bill_no', 'no', 'reference', 'order id', 'order_id']
            .includes(k.toLowerCase().trim())
          );
          
          // 2. Fallback: If no match, just use the VERY FIRST column of the sheet
          if (!invoiceKey && keys.length > 0) {
            invoiceKey = keys[0];
          }
          
          return invoiceKey ? String(row[invoiceKey]).trim() : '';
        }).filter(id => id !== '');

        if (extractedInvoices.length === 0) {
          log("ERROR: No data found in the spreadsheet columns.");
          alert("Could not find any data in your spreadsheet. Please ensure the first column contains your Invoice Numbers.");
          return;
        }

        log(`SUCCESS: Found "${Object.keys(data[0])[0]}" as the primary column. Extracted ${extractedInvoices.length} IDs.`);

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
        log("SUCCESS: Audit list populated.");
      } catch (error: any) {
        log(`FATAL ERROR: ${error.message}`);
        alert("Failed to read the file. See debug log below.");
      }
    };
    reader.onerror = () => log("FileReader error occurred.");
    reader.readAsBinaryString(file);
  };

  // 2. Bulk Status Checker (J&T Sync)
  const refreshAllStatuses = async () => {
    setIsSyncing(true);
    const updatedList = [...auditList];
    
    for (let i = 0; i < updatedList.length; i++) {
      const result = await SyncService.syncParcel(updatedList[i].trackingNumber);
      if (result) updatedList[i] = { ...result };
    }
    
    setAuditList(updatedList);
    setIsSyncing(false);
  };

  const stats = {
    total: auditList.length,
    pickedUp: auditList.filter(p => p.status === 'OUT_FOR_DELIVERY' || p.status === 'DELIVERED').length,
    missing: auditList.filter(p => p.status === 'IN_BUILDING').length
  };

  const filteredList = auditList.filter(p => 
    p.trackingNumber.includes(searchTerm) || p.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Stats Dashboard */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">RECONCILIATION HUB</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">J&T Express & Spreadsheet Audit</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center min-w-[120px]">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total in Sheet</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-100 text-center min-w-[120px]">
              <p className="text-[10px] font-black text-emerald-100 uppercase">Picked Up</p>
              <p className="text-2xl font-black text-white">{stats.pickedUp}</p>
            </div>
            <div className="bg-rose-500 p-4 rounded-2xl shadow-lg shadow-rose-100 text-center min-w-[120px]">
              <p className="text-[10px] font-black text-rose-100 uppercase">Missing</p>
              <p className="text-2xl font-black text-white">{stats.missing}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 relative">
            <input 
              type="text" 
              placeholder="Search Invoice or Recipient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-slate-900 focus:outline-none font-bold"
            />
            <span className="absolute left-4 top-4 text-slate-400">🔍</span>
          </div>
          
          <label className="cursor-pointer bg-slate-900 text-white py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <span>📁 Upload Spreadsheet</span>
            <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} />
          </label>
        </div>

        <button 
          onClick={refreshAllStatuses}
          disabled={isSyncing || auditList.length === 0}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all border-4 ${
            isSyncing ? 'bg-slate-100 text-slate-400 border-slate-100' : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
          }`}
        >
          {isSyncing ? '🔄 RECONCILING WITH J&T ECOSYSTEM...' : '⚡ REFRESH ALL STATUSES'}
        </button>

        {/* Live Tally Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LIST A: PENDING (MISSING) */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              List A: Pending / Not Picked Up
            </h2>
            <div className="space-y-3">
              {filteredList.filter(p => p.status === 'IN_BUILDING').map(p => (
                <div key={p.trackingNumber} className="bg-white p-4 rounded-xl border-l-8 border-rose-500 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-900">#{p.trackingNumber}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">{p.recipient}</p>
                  </div>
                  <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Missing At J&T</span>
                </div>
              ))}
            </div>
          </div>

          {/* LIST B: COMPLETED (PICKED UP) */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              List B: Verified & Picked Up
            </h2>
            <div className="space-y-3">
              {filteredList.filter(p => p.status !== 'IN_BUILDING').map(p => (
                <div key={p.trackingNumber} className="bg-white p-4 rounded-xl border-l-8 border-emerald-500 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-900">#{p.trackingNumber}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">{p.recipient}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter block mb-1">Tally Confirmed</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{p.jtWaybillNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* DEBUG MONITOR */}
        <div className="mt-12 p-6 bg-slate-900 rounded-2xl border-4 border-slate-800">
          <h3 className="text-rose-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            System Debug Monitor (Real-Time)
          </h3>
          <div className="space-y-2 font-mono text-xs">
            {debugLog.length === 0 ? (
              <p className="text-slate-600 italic">No activity detected. Waiting for file upload...</p>
            ) : (
              debugLog.map((l, i) => (
                <p key={i} className="text-slate-300">
                  <span className="text-emerald-500 mr-2">➜</span> {l}
                </p>
              ))
            )}
          </div>
        </div>

        {auditList.length === 0 && (
          <div className="py-20 text-center border-4 border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 font-black text-xl italic uppercase tracking-tighter">Drag and drop your spreadsheet to begin audit</p>
            <p className="text-slate-300 text-xs font-bold mt-2">SUPPORTED FORMATS: .XLSX, .CSV (Expected Column: "invoice_no")</p>
          </div>
        )}

      </div>
    </main>
  );
}
