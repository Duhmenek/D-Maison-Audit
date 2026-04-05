'use client';

import { useState } from 'react';

const initialRepairs = [
  { id: '1', ticket: 'REP-1021', customer: 'Alice Johnson', item: 'Diamond Engagement Ring', issue: 'Sizing & Polishing', status: 'INTAKE', date: '2026-03-12', cost: '$120' },
  { id: '2', ticket: 'REP-1022', customer: 'Bob Smith', item: 'Rolex GMT-Master II', issue: 'Full Overhaul Service', status: 'IN_PROGRESS', date: '2026-03-15', cost: '$850' },
  { id: '3', ticket: 'REP-1023', customer: 'Clara Davis', item: 'Pearl Earrings', issue: 'Restring & New Clasp', status: 'AWAITING_PARTS', date: '2026-03-20', cost: '$75' },
  { id: '4', ticket: 'REP-1024', customer: 'David Wilson', item: 'Gold Tennis Bracelet', issue: 'Safety Chain Repair', status: 'READY', date: '2026-03-11', cost: '$150' },
  { id: '5', ticket: 'REP-1025', customer: 'Eve Brown', item: 'Omega Seamaster', issue: 'Battery & Gasket Replacement', status: 'INTAKE', date: '2026-03-14', cost: '$95' },
];

const COLUMNS = [
  { id: 'INTAKE', name: 'Intake / New', color: 'bg-blue-50 text-blue-600' },
  { id: 'IN_PROGRESS', name: 'On Workbench', color: 'bg-amber-50 text-amber-600' },
  { id: 'AWAITING_PARTS', name: 'Awaiting Parts', color: 'bg-rose-50 text-rose-600' },
  { id: 'READY', name: 'Ready for Pickup', color: 'bg-emerald-50 text-emerald-600' },
];

export default function Repairs() {
  const [repairs, setRepairs] = useState(initialRepairs);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Service & Repairs</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">D-Maison Technical Workshop Workflow</p>
        </div>
        <button className="px-6 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#947a46] transition-all shadow-xl shadow-slate-200">
          Open New Repair Ticket
        </button>
      </header>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col space-y-4">
            <div className={`p-4 rounded-2xl flex items-center justify-between ${column.color}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">{column.name}</span>
              <span className="text-xs font-black px-2 bg-white/50 rounded-lg">
                {repairs.filter(r => r.status === column.id).length}
              </span>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {repairs.filter(r => r.status === column.id).map((repair) => (
                <div 
                  key={repair.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black text-[#947a46] uppercase tracking-widest">{repair.ticket}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Due: {repair.date}</p>
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{repair.item}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Client: {repair.customer}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-xs font-black text-[#0f172a]">{repair.cost}</p>
                    <div className="flex -space-x-2">
                       <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">T1</div>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-[9px] text-slate-400 font-medium italic group-hover:text-slate-600 transition-colors">
                    "{repair.issue}"
                  </p>
                </div>
              ))}
              
              {repairs.filter(r => r.status === column.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Active Tickets</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
