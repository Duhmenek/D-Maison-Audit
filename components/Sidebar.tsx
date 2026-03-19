'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
  ) },
  { name: 'J&T RECONCILIATION', href: '/dashboard/jnt-reconciliation', icon: (
    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
  ) },
  { name: 'Inventory', href: '/dashboard/inventory', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
  ) },
  { name: 'POS / Sales', href: '/dashboard/pos', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
  ) },
  { name: 'Repairs', href: '/dashboard/repairs', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
  ) },
  { name: 'Customers', href: '/dashboard/customers', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
  ) },
  { name: 'Audit / Reports', href: '/dashboard/reports', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
  ) },
  { name: 'Settings', href: '/dashboard/settings', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
  ) },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-slate-100 flex items-center justify-center bg-[#0f172a]">
        <h1 className="text-xl font-serif font-black text-white tracking-[0.2em] uppercase">DD-MAISON</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto bg-[#fcfcfc]">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#947a46] text-white shadow-lg shadow-yellow-900/10' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#947a46]'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-white' : 'group-hover:text-[#947a46]'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-bold tracking-wide uppercase">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex items-center space-x-3 mb-6 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold text-xs">
            DS
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Dom Salto</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrator</p>
          </div>
        </div>
        <button className="w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-red-500 py-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
