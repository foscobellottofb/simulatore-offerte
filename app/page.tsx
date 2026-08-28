import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="p-4 sm:p-10 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Simulatore offerte Enel Business</h1>
      <p className="text-enel-ink/60 mb-8">
        Confronta le offerte luce e gas Enel a partire da consumo e potenza del cliente, valuta un'offerta
        concorrente e genera una bolletta simulata in PDF.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/simulatore" className="card p-5 hover:border-enel-navy transition-colors">
          <div className="w-6 h-6 rounded bg-enel-navy text-white text-xs font-bold flex items-center justify-center mb-2">1</div>
          <div className="text-sm font-semibold mb-1">Simulatore offerte</div>
          <div className="text-xs text-enel-ink/60">Inserisci kW e consumo, confronta le offerte Enel disponibili</div>
        </Link>
        <Link href="/concorrenza" className="card p-5 hover:border-enel-navy transition-colors">
          <div className="w-6 h-6 rounded bg-enel-navy text-white text-xs font-bold flex items-center justify-center mb-2">2</div>
          <div className="text-sm font-semibold mb-1">Confronto concorrenza</div>
          <div className="text-xs text-enel-ink/60">Prezzo kWh e CCV a mano o da foto bolletta</div>
        </Link>
        <Link href="/admin" className="card p-5 hover:border-enel-navy transition-colors">
          <div className="w-6 h-6 rounded bg-enel-navy text-white text-xs font-bold flex items-center justify-center mb-2">3</div>
          <div className="text-sm font-semibold mb-1">Dati e parametri</div>
          <div className="text-xs text-enel-ink/60">Aggiorna offerte, accise, IVA e oneri</div>
        </Link>
      </div>
    </div>
  );
}
