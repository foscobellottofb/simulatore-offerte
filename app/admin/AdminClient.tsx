'use client';

import { useEffect, useState } from 'react';
import { Offerta, ParametroDettaglio } from '@/lib/types';

export function AdminClient() {
  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [tab, setTab] = useState<'offerte' | 'parametri'>('offerte');

  useEffect(() => {
    fetch('/api/offerte').then((r) => r.json()).then(setOfferte);
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
    await fetch(`/api/offerte/${id}`, { method: 'DELETE' });
    setOfferte((prev) => prev.filter((o) => o.id !== id));
  }

  const categorie = Array.from(new Set(parametri.map((p) => p.categoria)));

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dati e parametri</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Qui aggiorni le offerte Enel e le voci di dettaglio (accise, IVA, oneri) usate nei calcoli, senza dover
        toccare il codice.
      </p>

      <div className="flex gap-2 mb-5">
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
      </div>

      {tab === 'offerte' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-enel-paper text-enel-ink/60 text-xs uppercase">
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
                  <td className="px-4 py-2.5 font-medium">{o.nome}</td>
                  <td className="px-4 py-2.5">{o.commodity}</td>
                  <td className="px-4 py-2.5">{o.tipoPrezzo}</td>
                  <td className="px-4 py-2.5 text-right">{(o.prezzoFisso ?? o.cap ?? 0).toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right">{o.ccvMensile.toFixed(2)} €</td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-red-600 hover:underline" onClick={() => disattivaOfferta(o.id)}>
                      Disattiva
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-enel-ink/50 border-t border-enel-line">
            La creazione/modifica puntuale delle offerte è pensata per essere fatta via import dal file Excel
            aggiornato (script separato) o aggiungendo un form dedicato — dimmi se vuoi che lo costruiamo.
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
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="flex-1 text-sm text-enel-ink/70">
                        {p.etichetta} <span className="text-xs text-enel-ink/40">({p.commodity ?? 'entrambe'})</span>
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        className="input w-32"
                        value={p.valore}
                        onChange={(e) => aggiornaParametro(p.id, Number(e.target.value))}
                      />
                      <span className="text-xs text-enel-ink/40 w-16">{p.unita}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <button className="btn-primary text-sm mt-2" onClick={salvaParametri} disabled={salvando}>
            {salvando ? 'Salvataggio…' : 'Salva parametri'}
          </button>
        </div>
      )}
    </div>
  );
}
