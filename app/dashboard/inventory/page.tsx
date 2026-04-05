'use client';

import { useState } from 'react';

// Mock Data for Initial UI
const initialItems = [
  { id: '1', sku: 'DM-RNG-001', name: 'Diamond Solitaire Ring', category: 'RING', material: '18k White Gold', weight: '3.5g', retail_price: '$4,200', status: 'IN_STOCK', image: '💍' },
  { id: '2', sku: 'DM-WTC-042', name: 'Vintage Chronograph', category: 'WATCH', material: 'Stainless Steel', weight: '142g', retail_price: '$8,500', status: 'IN_STOCK', image: '⌚' },
  { id: '3', sku: 'DM-NEC-015', name: 'Pearl Strand Necklace', category: 'NECKLACE', material: 'Sterling Silver', weight: '24g', retail_price: '$1,800', status: 'REPAIR', image: '📿' },
  { id: '4', sku: 'DM-ERN-009', name: 'Emerald Drop Earrings', category: 'EARRINGS', material: '22k Yellow Gold', weight: '8.2g', retail_price: '$3,100', status: 'SOLD', image: '💎' },
  { id: '5', sku: 'DM-RNG-022', name: 'Sapphire Eternity Band', category: 'RING', material: 'Platinum', weight: '4.1g', retail_price: '$5,400', status: 'IN_STOCK', image: '💍' },
  { id: '6', sku: 'DM-BRC-011', name: 'Diamond Tennis Bracelet', category: 'BRACELET', material: '14k White Gold', weight: '12g', retail_price: '$6,200', status: 'MEMO', image: '✨' },
];

export default function Inventory() {
  const [items, setItems] = useState(initialItems);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredItems = filterStatus === 'ALL' 
    ? items 
    : items.filter(item => item.status === filterStatus);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Inventory Catalog</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">D-Maison Serialized Stock Management</p>
        </div>
        <button className="px-6 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#947a46] transition-all shadow-xl shadow-slate-200">
          Add New Item
        </button>
      </header>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex space-x-2">
          {['ALL', 'IN_STOCK', 'REPAIR', 'MEMO', 'SOLD'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === status 
                  ? 'bg-[#947a46] text-white shadow-lg shadow-yellow-900/10' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="SEARCH BY SKU, NAME OR MATERIAL..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#947a46]"
          />
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.sku} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="aspect-square bg-slate-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500 relative">
               {item.image}
               <div className={`absolute top-4 right-4 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm ${
                 item.status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-600' :
                 item.status === 'REPAIR' ? 'bg-amber-50 text-amber-600' :
                 item.status === 'SOLD' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
               }`}>
                 {item.status.replace('_', ' ')}
               </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-black text-[#947a46] uppercase tracking-widest mb-1">{item.category}</p>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{item.name}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">SKU: {item.sku}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Retail Price</p>
                  <p className="font-black text-[#0f172a]">{item.retail_price}</p>
                </div>
                <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-[#0f172a] hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
