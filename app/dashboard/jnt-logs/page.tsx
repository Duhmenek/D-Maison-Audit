'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StaffLog {
  log_id: number;
  staff_name: string;
  date_processed: string;
  invoice_number: string;
  timestamp: string;
  sync_status: number;
}

export default function JntLogs() {
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/staff-logs');
      const result = await res.json();
      if (result.success) {
        setStaffLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    const search = logSearch.toLowerCase().trim();
    if (!search) return staffLogs;
    return staffLogs.filter(log => 
      log.staff_name.toLowerCase().includes(search) || 
      log.invoice_number.toLowerCase().includes(search) ||
      log.date_processed.includes(search)
    );
  }, [staffLogs, logSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">J&T <span className="text-emerald-500">Verification Logs</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Audit Trail & Activity Protocol</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">System Activity History</h3>
          </div>
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              placeholder="Search logs (Staff/Invoice/Date)..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full bg-slate-800 border-none text-white text-[10px] font-bold px-4 py-2 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto max-h-[700px]">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-black text-slate-400 uppercase">Staff Name</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase">Verification Date</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase">Invoice Number</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase">System Timestamp</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900 uppercase tracking-tight">{log.staff_name}</td>
                  <td className="px-6 py-4 font-bold text-slate-500">{log.date_processed}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-rose-500">#{log.invoice_number}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-32 text-center">
                    <div className="space-y-2 opacity-30">
                      <p className="text-2xl">📋</p>
                      <p className="text-[10px] font-black uppercase tracking-widest">No activity logs found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
              {isLoading && (
                 <tr>
                 <td colSpan={5} className="px-6 py-32 text-center">
                   <div className="animate-pulse flex flex-col items-center gap-2">
                     <div className="w-8 h-8 bg-slate-200 rounded-full" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Logs...</p>
                   </div>
                 </td>
               </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
