'use client';

import { useState } from 'react';
import { ExtractedTransaction } from '@/app/lib/bank-parser';

export default function RevenueDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    totalRevenue: number | string;
    transactions: ExtractedTransaction[];
  } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/audit/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("System Error during upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Audit Control</h1>
            <p className="text-slate-500">Bank Revenue Verification & PDF Archiving</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
            Role: <span className="text-[#5e6c37] font-bold">CEO / AUDITOR</span>
          </div>
        </div>

        {/* Top Grid: Upload & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-lg">Upload Bank Statement</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#5e6c37] transition-colors cursor-pointer bg-slate-50 group">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="pdf-upload" 
                />
                <label htmlFor="pdf-upload" className="cursor-pointer space-y-2">
                  <div className="text-4xl group-hover:scale-110 transition-transform text-[#5e6c37]">📄</div>
                  <div className="text-sm font-medium text-slate-600">
                    {file ? file.name : "Click to select PDF Statement"}
                  </div>
                </label>
              </div>
              <button 
                disabled={!file || loading}
                className="w-full bg-[#5e6c37] text-white py-3 rounded-xl font-bold hover:bg-[#4a552b] disabled:bg-slate-300 transition-all shadow-lg shadow-slate-200"
              >
                {loading ? "Analyzing..." : "Process Audit"}
              </button>
            </form>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#5e6c37] text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="text-[#d9e3bc] text-sm font-bold uppercase tracking-wider">Total Revenue Found</div>
              <div className="text-4xl font-black mt-2">
                {summary?.totalRevenue !== "Not found in statement" 
                  ? `₱${Number(summary?.totalRevenue).toLocaleString()}` 
                  : "₱0.00"}
              </div>
              <div className="text-[#d9e3bc] text-xs mt-4">Verified from latest PDF upload</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Transaction Count</div>
              <div className="text-4xl font-black text-slate-800 mt-2">
                {summary?.transactions.length || 0}
              </div>
              <div className="text-slate-400 text-xs mt-4">Rows extracted successfully</div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Statement Transactions (Digital Ledger)</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 font-bold uppercase">Source: PDF Extract</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 font-bold uppercase bg-slate-50/50">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{tx.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{tx.description}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    ₱{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      tx.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                </tr>
              ))}
              {!summary && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-300 italic">
                    No data processed. Please upload a bank statement to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
