'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/simulatore', label: 'Simulatore offerte', hint: 'kW, consumo → confronto' },
  { href: '/concorrenza', label: 'Confronto concorrenza', hint: 'prezzo, CCV, foto bolletta' },
  { href: '/mercato', label: 'Mercato dell\'energia', hint: 'PUN, storico, concorrenza' },
  { href: '/admin', label: 'Dati e parametri', hint: 'offerte e voci di dettaglio' },
  { href: '/aiuto', label: 'Aiuto', hint: 'come funziona ogni pagina' }
];

// Piccolo blocco logo "8": stessa idea dell'avatar del progetto (due anelli),
// qui in blu Enel su sfondo bianco, per restare leggero nella sidebar chiara.
function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="6" fill="#006FBB" />
      <circle cx="13" cy="9.5" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="13" cy="17" r="4.3" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    </svg>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Barra superiore visibile solo su mobile */}
      <div className="md:hidden sticky top-0 z-30">
        <div className="h-1.5 bg-enel-navy" />
        <div className="flex items-center justify-between bg-white border-b border-enel-line px-4 py-3">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <LogoMark />
            <div>
              <div className="text-base font-semibold tracking-tight text-enel-ink">simulOTTO</div>
              <div className="text-[11px] text-enel-ink/40">Enel SMB · Simulatore offerte</div>
            </div>
          </Link>
          <button aria-label="Apri menu" onClick={() => setOpen(true)} className="p-2 -mr-2 text-enel-ink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay scuro quando il menu mobile è aperto */}
      {open && <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

      {/* Menu laterale: sempre visibile da tablet in su, a scomparsa su mobile */}
      <aside
        className={`w-64 shrink-0 bg-white border-r border-enel-line flex flex-col
          fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-1.5 bg-enel-navy hidden md:block" />
        <div className="px-5 py-5 border-b border-enel-line hidden md:block">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoMark />
            <div>
              <div className="text-base font-semibold tracking-tight text-enel-ink">simulOTTO</div>
              <div className="text-xs text-enel-ink/40 mt-0.5">Enel SMB · Simulatore offerte</div>
            </div>
          </Link>
        </div>
        <div className="md:hidden flex justify-end px-4 py-3">
          <button aria-label="Chiudi menu" onClick={() => setOpen(false)} className="p-2 text-enel-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const attiva = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg pl-3 pr-3 py-2.5 border-l-2 transition-colors ${
                  attiva ? 'border-enel-green bg-enel-green/5' : 'border-transparent hover:bg-enel-paper'
                }`}
              >
                {item.href === '/aiuto' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-enel-ink/40 shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 0 1 4.7 1.2c0 1.6-2.2 1.8-2.2 3.3" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                )}
                <div>
                  <div className={`text-sm font-medium ${attiva ? 'text-enel-navy' : 'text-enel-ink'}`}>{item.label}</div>
                  <div className="text-xs text-enel-ink/40">{item.hint}</div>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-enel-line text-xs text-enel-ink/40">
          Dati aggiornati manualmente dalla pagina "Dati e parametri"
        </div>
      </aside>
    </>
  );
}
