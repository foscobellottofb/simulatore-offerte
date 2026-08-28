import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Simulatore Offerte Enel Business',
  description: 'Confronto offerte Enel SMB e simulazione bolletta vs concorrenza'
};

const NAV = [
  { href: '/simulatore', label: 'Simulatore offerte', hint: 'kW, consumo → confronto' },
  { href: '/concorrenza', label: 'Confronto concorrenza', hint: 'prezzo, CCV, foto bolletta' },
  { href: '/admin', label: 'Dati e parametri', hint: 'offerte e voci di dettaglio' }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-64 shrink-0 bg-enel-ink text-white flex flex-col">
            <div className="px-5 py-6 border-b border-white/10">
              <div className="text-lg font-semibold tracking-tight">Enel Business</div>
              <div className="text-xs text-white/50 mt-0.5">Simulatore offerte SMB</div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
