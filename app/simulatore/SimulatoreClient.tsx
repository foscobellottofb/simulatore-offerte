'use client';

import { useEffect, useMemo, useState } from 'react';
import { Offerta, ParametroDettaglio, RisultatoCalcolo, Commodity } from '@/lib/types';
import { calcolaTutteLeOfferte } from '@/lib/calcoli';

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function SimulatoreClient() {
  const [commodity, setCommodity] = useState<Commodity>('LUCE');
  const [consumoAnnuoKwh, setConsumoAnnuoKwh] = useState(5000);
  const [potenzaKw, setPotenzaKw] = useState(20);
  const [giorniFattura, setGiorniFattura] = useState(60);

  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selezionata, setSelezionata] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/offerte').then((r) => r.json()), fetch('/api/parametri').then((r) => r.json())]).then(
      ([o, p]) => {
        setOfferte(o);
        setParametri(p);
        setLoading(false);
      }
    );
  }, []);

  const risultati: RisultatoCalcolo[] = useMemo(() => {
    if (loading) return [];
    return calcolaTutteLeOfferte(offerte, { commodity, consumoAnnuoKwh, potenzaKw, giorniFattura }, parametri);
  }, [offerte, parametri, commodity, consumoAnnuoKwh, potenzaKw, giorniFattura, loading]);

  const migliore = risultati[0];
  const attiva = risultati.find((r) => r.offerta.id === selezionata) ?? migliore;

  async function scaricaPdf() {
    if (!attiva) return;
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        risultato: attiva,
        input: { commodity, consumoAnnuoKwh, potenzaKw, giorniFattura },
        nomeCliente
      })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolletta-simulata-${attiva.offerta.nome}.pdf`;
    a.click();
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Simulatore offerte</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Inserisci i dati del cliente per vedere le offerte Enel disponibili e il confronto voce per voce.
      </p>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
          <div>
            <label className="label">Commodity</label>
            <select className="input" value={commodity} onChange={(e) => setCommodity(e.target.value as Commodity)}>
              <option value="LUCE">Luce</option>
              <option value="GAS">Gas</option>
            </select>
          </div>
          <div>
            <label className="label">Consumo annuo kWh</label>
            <input
              type="number"
              className="input"
              value={consumoAnnuoKwh}
              onChange={(e) => setConsumoAnnuoKwh(Number(e.target.value))}
            />
          </div>
          {commodity === 'LUCE' && (
            <div>
              <label className="label">Potenza kW</label>
              <input type="number" className="input" value={potenzaKw} onChange={(e) => setPotenzaKw(Number(e.target.value))} />
            </div>
          )}
          <div>
            <label className="label">Giorni fattura</label>
            <input
              type="number"
              className="input"
              value={giorniFattura}
              onChange={(e) => setGiorniFattura(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Nome cliente (opzionale)</label>
            <input className="input" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-enel-ink/50">Caricamento offerte…</div>
      ) : risultati.length === 0 ? (
        <div className="card p-5 text-sm text-enel-ink/60">Nessuna offerta disponibile per questi parametri.</div>
      ) : (
        <>
          <div className="card overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-enel-line font-medium text-sm">Elenco offerte</div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-enel-paper text-enel-ink/60 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-2">Offerta</th>
                  <th className="text-right px-5 py-2">Prezzo</th>
                  <th className="text-right px-5 py-2">CCV/mese</th>
                  <th className="text-right px-5 py-2">Totale periodo</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {risultati.map((r) => (
                  <tr
                    key={r.offerta.id}
                    className={`border-t border-enel-line ${r.offerta.id === attiva?.offerta.id ? 'bg-enel-green/5' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.offerta.nome}</div>
                      <div className="text-xs text-enel-ink/50">{r.offerta.vendibilita}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.offerta.tipoPrezzo === 'VARIABILE_CAP'
                        ? `CAP ${r.offerta.cap?.toFixed(4)} €/kWh`
                        : `${r.offerta.prezzoFisso?.toFixed(4)} €/kWh`}
                    </td>
                    <td className="px-5 py-3 text-right">{euro(r.offerta.ccvMensile)}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {euro(r.totaleBolletta)}
                      {r.offerta.id === migliore.offerta.id && (
                        <span className="ml-2 text-xs text-enel-green font-medium">migliore</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="btn-secondary text-xs py-1" onClick={() => setSelezionata(r.offerta.id)}>
                        Confronta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {attiva && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-medium text-sm">Dettaglio — {attiva.offerta.nome}</div>
                <button className="btn-primary text-xs" onClick={scaricaPdf}>
                  Scarica bolletta simulata (PDF)
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <RigaDettaglio label="Spesa energia" valore={attiva.spesaEnergia} />
                <RigaDettaglio label="Corrispettivo di vendita (CCV)" valore={attiva.spesaCcv} />
                {attiva.righeDettaglio.map((r, i) => (
                  <RigaDettaglio key={i} label={r.etichetta} valore={r.valore} />
                ))}
                <RigaDettaglio label="Imponibile" valore={attiva.totaleImponibile} bold />
                <RigaDettaglio label="IVA" valore={attiva.iva} />
                <div className="flex justify-between pt-3 mt-2 border-t border-enel-line text-base font-semibold">
                  <span>Totale bolletta</span>
                  <span>{euro(attiva.totaleBolletta)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RigaDettaglio({ label, valore, bold }: { label: string; valore: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 border-b border-enel-line/60 ${bold ? 'font-semibold' : ''}`}>
      <span className="text-enel-ink/70">{label}</span>
      <span>{euro(valore)}</span>
    </div>
  );
}
