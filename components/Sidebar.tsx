'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV = [
  { href: '/simulatore', label: 'Simulatore offerte', hint: 'kW, consumo → confronto' },
  { href: '/concorrenza', label: 'Confronto concorrenza', hint: 'prezzo, CCV, foto bolletta' },
  { href: '/admin', label: 'Dati e parametri', hint: 'offerte e voci di dettaglio' }
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superiore visibile solo su mobile */}
      <div className="md:hidden flex items-center justify-between bg-enel-navy text-white px-4 py-3 sticky top-0 z-30">
        <div>
          <div className="text-base font-semibold tracking-tight">Enel Business</div>
          <div className="text-[11px] text-white/50">Simulatore offerte SMB</div>
        </div>
        <button
          aria-label="Apri menu"
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Overlay scuro quando il menu mobile è aperto */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menu laterale: sempre visibile da tablet in su, a scomparsa su mobile */}
      <aside
        className={`w-64 shrink-0 bg-enel-navy text-white flex flex-col
          fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="px-5 py-6 border-b border-white/10 hidden md:block">
          <div className="text-lg font-semibold tracking-tight">Enel Business</div>
          <div className="text-xs text-white/50 mt-0.5">Simulatore offerte SMB</div>
        </div>
        <div className="md:hidden flex justify-end px-4 py-3">
          <button aria-label="Chiudi menu" onClick={() => setOpen(false)} className="p-2 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 hover:bg-white/10 transition-colors"
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-white/40">{item.hint}</div>
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/40">
          Dati aggiornati manualmente dalla pagina "Dati e parametri"
        </div>
      </aside>
    </>
  );
}
