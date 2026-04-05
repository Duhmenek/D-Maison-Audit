'use client';

import { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentAuditItem {
  order_no: string;
  alt_no: string;
  tracking_number: string;
  customer_name: string;
  profile_name: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  paid_amount: number;
  payment_provider: string;
  account_no: string;
  account_name: string;
  paid_at: string;
  sku: string;
  item_name: string;
  item_qty: number;
  item_price: number;
  grand_total: number;
  discrepancy: string;
  audit_date: string;
}

export default function PaymentAuditPage() {
  const [items, setItems] = useState<PaymentAuditItem[]>([]);
  const [pasteInput, setPasteInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'UPLOAD' | 'DASHBOARD'>('UPLOAD');
  const [dbItems, setDbItems] = useState<PaymentAuditItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseData = (rawData: any[]) => {
    // Assuming first row is headers
    const headers = rawData[0].map((h: any) => String(h).toLowerCase().trim());
    const rows = rawData.slice(1);

    const getIdx = (possibleNames: string[]) => {
      return headers.findIndex(h => possibleNames.includes(h));
    };

    const idx = {
      no: getIdx(['no.', 'no', 'order no', 'order number']),
      alt_no: getIdx(['alt no.', 'alt no', 'alternative number']),
      tracking: getIdx(['tracking number', 'tracking', 'waybill']),
      customer: getIdx(['customer name', 'customer']),
      profile: getIdx(['profile name', 'profile']),
      subtotal: getIdx(['subtotal']),
      shipping: getIdx(['shipping cost', 'shipping']),
      discount: getIdx(['discount']),
      total: getIdx(['total']),
      paid_amount: getIdx(['paid amount', 'paid']),
      provider: getIdx(['payment provider', 'provider', 'payment method']),
      acc_no: getIdx(['account no.', 'account no', 'account number']),
      acc_name: getIdx(['account name']),
      paid_at: getIdx(['paid at', 'payment date']),
      sku: getIdx(['sku']),
      item_name: getIdx(['item name', 'item']),
      qty: getIdx(['item qty', 'qty', 'quantity']),
      price: getIdx(['item price', 'price']),
      grand_total: getIdx(['grand total'])
    };

    const parsedItems: PaymentAuditItem[] = rows.map(row => {
      const val = (index: number) => (index !== -1 ? row[index] : '');
      const num = (index: number) => {
        const v = val(index);
        if (typeof v === 'number') return v;
        return parseFloat(String(v || '0').replace(/[^0-9.-]+/g, '')) || 0;
      };

      const item_qty = num(idx.qty) || 1;
      const item_price = num(idx.price);
      const total = num(idx.total);
      const paid_amount = num(idx.paid_amount);

      let discrepancy = '';
      if (Math.abs(paid_amount - total) > 0.01) {
        discrepancy = `Paid amount (${paid_amount}) does not match total (${total})`;
      }

      return {
        order_no: String(val(idx.no)),
        alt_no: String(val(idx.alt_no)),
        tracking_number: String(val(idx.tracking)),
        customer_name: String(val(idx.customer)),
        profile_name: String(val(idx.profile)),
        subtotal: num(idx.subtotal),
        shipping_cost: num(idx.shipping),
        discount: num(idx.discount),
        total,
        paid_amount,
        payment_provider: String(val(idx.provider)),
        account_no: String(val(idx.acc_no)),
        account_name: String(val(idx.acc_name)),
        paid_at: String(val(idx.paid_at)),
        sku: String(val(idx.sku)),
        item_name: String(val(idx.item_name)),
        item_qty,
        item_price,
        grand_total: num(idx.grand_total),
        discrepancy,
        audit_date: filterDate
      };
    }).filter(item => item.order_no || item.sku);

    // Validation: sheet grand total vs sum of item subtotals
    const sumOfItemSubtotals = parsedItems.reduce((acc, curr) => acc + (curr.item_qty * curr.item_price), 0);
    // Find the max grand_total in the sheet (assuming it's either in every row or just one)
    const reportedGrandTotal = Math.max(...parsedItems.map(i => i.grand_total), 0);

    if (reportedGrandTotal > 0 && Math.abs(reportedGrandTotal - sumOfItemSubtotals) > 0.01) {
      alert(`Warning: Sheet Grand Total (${reportedGrandTotal}) does not match sum of individual item subtotals (${sumOfItemSubtotals})`);
    }

    return parsedItems;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const parsed = parseData(data as any[]);
      setItems(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handlePaste = () => {
    const lines = pasteInput.trim().split('\n');
    if (lines.length === 0) return;
    const data = lines.map(line => line.split('\t'));
    const parsed = parseData(data);
    setItems(parsed);
  };

  const saveAudit = async () => {
    if (items.length === 0) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/audit/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        alert('Audit saved successfully');
        setItems([]);
        setPasteInput('');
        fetchDbItems();
        setViewMode('DASHBOARD');
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchDbItems = async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch(`/api/audit/payment?startDate=${filterDate}&endDate=${filterDate}`);
      const result = await res.json();
      if (result.success) {
        setDbItems(result.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const dashboardStats = useMemo(() => {
    const source = viewMode === 'UPLOAD' ? items : dbItems;
    const totalOrders = new Set(source.map(i => i.order_no)).size;
    const totalRevenue = source.reduce((acc, curr) => acc + curr.paid_amount, 0);
    const totalShipping = source.reduce((acc, curr) => acc + curr.shipping_cost, 0);
    const discrepancies = source.filter(i => i.discrepancy).length;

    return { totalOrders, totalRevenue, totalShipping, discrepancies };
  }, [items, dbItems, viewMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] lowercase tracking-wider">payment <span className="text-[#947a46]">audit</span></h1>
          <p className="text-slate-400 font-bold text-xs lowercase tracking-widest mt-1">automated verification & reporting module</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => { setViewMode('UPLOAD'); fetchDbItems(); }}
            className={`px-6 py-3 rounded-xl text-xs font-black lowercase tracking-widest transition-all ${viewMode === 'UPLOAD' ? 'bg-[#947a46] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            upload portal
          </button>
          <button 
            onClick={() => { setViewMode('DASHBOARD'); fetchDbItems(); }}
            className={`px-6 py-3 rounded-xl text-xs font-black lowercase tracking-widest transition-all ${viewMode === 'DASHBOARD' ? 'bg-[#947a46] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            admin dashboard
          </button>
        </div>
      </header>

      {viewMode === 'UPLOAD' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Step 1: Upload or Paste</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#947a46] hover:text-[#947a46] transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <span className="text-[10px] font-black uppercase">Attach Confirmation Sheet</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  
                  <div className="relative">
                    <textarea 
                      value={pasteInput}
                      onChange={(e) => setPasteInput(e.target.value)}
                      placeholder="Or paste data here (TSV format from Excel)..."
                      className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#947a46] focus:outline-none font-mono text-[10px] transition-all"
                    />
                    <button 
                      onClick={handlePaste}
                      className="absolute bottom-4 right-4 px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg shadow-lg hover:bg-[#947a46] transition-all"
                    >
                      Process Paste
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Step 2: Verify & Lock</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Items Ready</span>
                    <span className="text-sm font-black text-slate-900">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Audit Date</span>
                    <input 
                      type="date" 
                      value={filterDate} 
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                  <button 
                    disabled={items.length === 0 || isUploading}
                    onClick={saveAudit}
                    className="w-full py-4 bg-[#0f172a] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-[#0f172a] transition-all shadow-xl shadow-slate-200"
                  >
                    {isUploading ? 'Syncing...' : 'Confirm & Record Audit'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Staging Area: Distributed Data</h3>
                  {items.length > 0 && (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Validating Live...</span>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">Order #</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">Customer</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">SKU</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50">Payment</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50 text-right">Paid</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase border-b border-slate-50 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${item.discrepancy ? 'bg-rose-50/50' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-900">#{item.order_no}</td>
                          <td className="px-6 py-4 uppercase font-bold text-slate-500">{item.customer_name}</td>
                          <td className="px-6 py-4 font-mono">{item.sku}</td>
                          <td className="px-6 py-4 uppercase text-slate-400">{item.payment_provider}</td>
                          <td className="px-6 py-4 text-right font-black">₱{item.paid_amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            {item.discrepancy ? (
                              <span className="text-rose-500 font-black uppercase text-[8px] bg-rose-100 px-2 py-0.5 rounded shadow-sm" title={item.discrepancy}>Discrepancy</span>
                            ) : (
                              <span className="text-emerald-500 font-black uppercase text-[8px] bg-emerald-100 px-2 py-0.5 rounded shadow-sm">Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic uppercase tracking-widest">No data staged for audit...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dashboard View */}
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm w-fit">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Period:</label>
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-[#947a46] transition-all"
            />
            <button 
              onClick={fetchDbItems}
              className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-[#947a46] transition-all"
            >
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="orders confirmed" value={dashboardStats.totalOrders} icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>} />
            <StatCard label="revenue confirmed" value={`₱${dashboardStats.totalRevenue.toLocaleString()}`} icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
            <StatCard label="shipping collected" value={`₱${dashboardStats.totalShipping.toLocaleString()}`} icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
            <StatCard label="discrepancies" value={dashboardStats.discrepancies} color={dashboardStats.discrepancies > 0 ? 'rose' : 'emerald'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 lowercase tracking-widest">confirmed audit records</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-400 lowercase tracking-widest">locked records</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-white border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Order #</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">SKU</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Payment Provider</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">Amount Paid</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">Confirmed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dbItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-900">#{item.order_no}</td>
                      <td className="px-6 py-4 uppercase font-bold text-slate-500">{item.customer_name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-[#947a46]">{item.sku}</td>
                      <td className="px-6 py-4 uppercase text-slate-400">{item.payment_provider}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">₱{item.paid_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-400 font-bold">
                        {new Date(item.confirmed_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {dbItems.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic uppercase tracking-widest">No records found for this date...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'white' }: any) {
  const colorClasses: any = {
    white: 'bg-white text-slate-900',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between ${colorClasses[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-black italic tracking-tighter uppercase">{value}</h3>
      </div>
    </div>
  );
}
