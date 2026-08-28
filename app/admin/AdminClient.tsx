'use client';

import { useEffect, useState } from 'react';
import { Offerta, ParametroDettaglio } from '@/lib/types';
import { OffertaForm } from './OffertaForm';

export function AdminClient() {
  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [tab, setTab] = useState<'offerte' | 'parametri'>('offerte');
  const [formAperto, setFormAperto] = useState<'nuova' | Offerta | null>(null);

  function ricaricaOfferte() {
    fetch('/api/offerte').then((r) => r.json()).then(setOfferte);
  }

  useEffect(() => {
    ricaricaOfferte();
    fetch('/api/parametri').then((r) => r.json()).then(setParametri);
  }, []);

  function aggiornaParametro(id: string, valore: number) {
    setParametri((prev) => prev.map((p) => (p.id === id ? { ...p, valore } : p)));
  }

  async function salvaParametri() {
    setSalvando(true);
    await fetch('/api/parametri', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametri.map((p) => ({ id: p.id, valore: p.valore })))
    });
    setSalvando(false);
  }

  async function disattivaOfferta(id: string) {
    if (!confirm('Disattivare questa offerta? Non comparirà più nel simulatore, ma resta nello storico.')) return;
    await fetch(`/api/offerte/${id}`, { method: 'DELETE' });
    setOfferte((prev) => prev.filter((o) => o.id !== id));
  }

  const categorie = Array.from(new Set(parametri.map((p) => p.categoria)));

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dati e parametri</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Qui aggiorni le offerte Enel e le voci di dettaglio (accise, IVA, oneri) usate nei calcoli, senza dover
        toccare il codice.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          className={tab === 'offerte' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
          onClick={() => setTab('offerte')}
        >
          Offerte ({offerte.length})
        </button>
        <button
          className={tab === 'parametri' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
          onClick={() => setTab('parametri')}
        >
          Parametri di dettaglio
        </button>
        {tab === 'offerte' && (
          <button className="btn-primary text-xs ml-auto" onClick={() => setFormAperto('nuova')}>
            + Aggiungi offerta
          </button>
        )}
      </div>

      {tab === 'offerte' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-enel-navy text-white/80 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">Commodity</th>
                <th className="text-left px-4 py-2">Tipo prezzo</th>
                <th className="text-right px-4 py-2">Prezzo/CAP</th>
                <th className="text-right px-4 py-2">CCV</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {offerte.map((o) => (
                <tr key={o.id} className="border-t border-enel-line">
                  <td className="px-4 py-2.5 font-medium">
                    {o.nome}
                    {o.note && <div className="text-xs text-enel-amber font-normal mt-0.5">⚠ nota</div>}
                  </td>
                  <td className="px-4 py-2.5">{o.commodity}</td>
                  <td className="px-4 py-2.5">{o.tipoPrezzo}</td>
                  <td className="px-4 py-2.5 text-right">{(o.prezzoFisso ?? o.cap ?? 0).toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right">{o.ccvMensile.toFixed(2)} €</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button className="text-xs text-enel-green hover:underline mr-3" onClick={() => setFormAperto(o)}>
                      Modifica
                    </button>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => disattivaOfferta(o.id)}>
                      Disattiva
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'parametri' && (
        <div className="card p-5">
          {categorie.map((cat) => (
            <div key={cat} className="mb-6">
              <div className="text-sm font-semibold mb-2">{cat}</div>
              <div className="space-y-2">
                {parametri
                  .filter((p) => p.categoria === cat)
                  .map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[160px] text-sm text-enel-ink/70">
                        {p.etichetta} <span className="text-xs text-enel-ink/40">({p.commodity ?? 'entrambe'})</span>
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        className="input w-28 sm:w-32"
                        value={p.valore}
                        onChange={(e) => aggiornaParametro(p.id, Number(e.target.value))}
                      />
                      <span className="text-xs text-enel-ink/40 w-16">{p.unita}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div className="text-xs text-enel-ink/50 mb-4 pt-2 border-t border-enel-line">
            Le componenti di rete (distribuzione, trasmissione, oneri ASOS/ARIM) e l'accisa luce sono calcolate
            automaticamente per fascia di potenza dai dati ARERA e non compaiono qui.
          </div>
          <button className="btn-primary text-sm" onClick={salvaParametri} disabled={salvando}>
            {salvando ? 'Salvataggio…' : 'Salva parametri'}
          </button>
        </div>
      )}

      {formAperto && (
        <OffertaForm
          offerta={formAperto === 'nuova' ? null : formAperto}
          onClose={() => setFormAperto(null)}
          onSaved={ricaricaOfferte}
        />
      )}
    </div>
  );
}
