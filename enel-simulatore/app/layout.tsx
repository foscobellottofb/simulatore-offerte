import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

// Font reale caricato (prima era solo dichiarato in globals.css ma mai
// effettivamente incluso, quindi il browser usava un sans-serif di sistema
// qualsiasi). Inter è la migliore alternativa gratuita a "Enel Roobert",
// il font ufficiale del brand: proporzioni geometriche simili, molto
// leggibile in interfaccia.
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'simulOTTO — Enel SMB',
  description: 'Confronto offerte Enel SMB e simulazione bolletta vs concorrenza'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="font-body">
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
