'use client';

import { useEffect, useMemo, useState } from 'react';
import { Offerta, ParametroDettaglio, Commodity } from '@/lib/types';
import { calcolaTutteLeOfferte, calcolaConcorrente } from '@/lib/calcoli';

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function ConcorrenzaClient() {
  const [commodity, setCommodity] = useState<Commodity>('LUCE');
  const [consumoAnnuoKwh, setConsumoAnnuoKwh] = useState(5000);
  const [potenzaKw, setPotenzaKw] = useState(20);
  const [giorniFattura, setGiorniFattura] = useState(60);

  const [prezzoKwh, setPrezzoKwh] = useState<number | ''>('');
  const [ccv, setCcv] = useState<number | ''>('');
  const [totaleDichiarato, setTotaleDichiarato] = useState<number | ''>('');
  const [nomeFornitore, setNomeFornitore] = useState('');

  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [ocrStato, setOcrStato] = useState<'idle' | 'analisi' | 'ok' | 'errore'>('idle');
  const [ocrNote, setOcrNote] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/offerte').then((r) => r.json()), fetch('/api/parametri').then((r) => r.json())]).then(
      ([o, p]) => {
        setOfferte(o);
        setParametri(p);
      }
    );
  }, []);

  const input = { commodity, consumoAnnuoKwh, potenzaKw, giorniFattura };

  const migliorEnel = useMemo(() => {
    const risultati = calcolaTutteLeOfferte(offerte, input, parametri);
    return risultati[0] ?? null;
  }, [offerte, parametri, commodity, consumoAnnuoKwh, potenzaKw, giorniFattura]);

  const risultatoConcorrente = useMemo(() => {
    if (prezzoKwh === '' || ccv === '' || parametri.length === 0) return null;
    return calcolaConcorrente(Number(prezzoKwh), Number(ccv), input, parametri);
  }, [prezzoKwh, ccv, parametri, commodity, consumoAnnuoKwh, potenzaKw, giorniFattura]);

  const risparmioAnnuo = useMemo(() => {
    if (!migliorEnel || !risultatoConcorrente) return null;
    const giorniAnno = 365 / giorniFattura;
    return (risultatoConcorrente.totaleBolletta - migliorEnel.totaleBolletta) * giorniAnno;
  }, [migliorEnel, risultatoConcorrente, giorniFattura]);

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrStato('analisi');
    setOcrNote(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type })
        });
        const data = await res.json();
        if (!res.ok) {
          setOcrStato('errore');
          setOcrNote(data.error ?? 'Estrazione non riuscita');
          return;
        }
        const prezzo = commodity === 'LUCE' ? data.prezzoKwhLuce : data.prezzoKwhGas;
        if (prezzo) setPrezzoKwh(prezzo);
        if (data.ccvMensile) setCcv(data.ccvMensile);
        if (data.totaleBolletta) setTotaleDichiarato(data.totaleBolletta);
        if (data.fornitore) setNomeFornitore(data.fornitore);
        setOcrStato('ok');
        if (data.confidenza !== 'alta' || data.note) {
          setOcrNote(
            `Confidenza ${data.confidenza ?? 'da verificare'}${data.note ? ' — ' + data.note : ''}. Controlla i valori prima di confermare.`
          );
        }
      } catch {
        setOcrStato('errore');
        setOcrNote('Errore di rete durante l\'analisi della foto');
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Confronto con la concorrenza</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Inserisci solo prezzo kWh e CCV del concorrente (a mano o da foto bolletta): gli altri dati restano quelli
        del cliente inseriti qui sotto.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="font-medium text-sm mb-4">Dati cliente</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Commodity</label>
              <select className="input" value={commodity} onChange={(e) => setCommodity(e.target.value as Commodity)}>
                <option value="LUCE">Luce</option>
                <option value="GAS">Gas</option>
              </select>
            </div>
            <div>
              <label className="label">Consumo annuo kWh</label>
              <input type="number" className="input" value={consumoAnnuoKwh} onChange={(e) => setConsumoAnnuoKwh(Number(e.target.value))} />
            </div>
            {commodity === 'LUCE' && (
              <div>
                <label className="label">Potenza kW</label>
                <input type="number" className="input" value={potenzaKw} onChange={(e) => setPotenzaKw(Number(e.target.value))} />
              </div>
            )}
            <div>
              <label className="label">Giorni fattura</label>
              <input type="number" className="input" value={giorniFattura} onChange={(e) => setGiorniFattura(Number(e.target.value))} />
            </div>
          </div>

          <div className="font-medium text-sm mb-3 pt-3 border-t border-enel-line">Bolletta concorrente</div>

          <label className="label">Foto bolletta (opzionale, precompila i campi)</label>
          <input type="file" accept="image/*" capture="environment" className="input mb-2" onChange={handleFoto} />
          {ocrStato === 'analisi' && <div className="text-xs text-enel-ink/50 mb-2">Analisi della foto in corso…</div>}
          {ocrStato === 'ok' && ocrNote && <div className="text-xs text-enel-amber mb-2">{ocrNote}</div>}
          {ocrStato === 'errore' && <div className="text-xs text-red-600 mb-2">{ocrNote}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fornitore</label>
              <input className="input" value={nomeFornitore} onChange={(e) => setNomeFornitore(e.target.value)} />
            </div>
            <div>
              <label className="label">Prezzo kWh (€)</label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={prezzoKwh}
                onChange={(e) => setPrezzoKwh(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">CCV mensile (€)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={ccv}
                onChange={(e) => setCcv(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Totale dichiarato (per verifica)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={totaleDichiarato}
                onChange={(e) => setTotaleDichiarato(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-medium text-sm mb-4">Confronto</div>
          {!migliorEnel || !risultatoConcorrente ? (
            <div className="text-sm text-enel-ink/50">Inserisci prezzo kWh e CCV del concorrente per vedere il confronto.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-enel-green/30 bg-enel-green/5 p-4">
                  <div className="text-xs text-enel-ink/60 mb-1">Enel — {migliorEnel.offerta.nome}</div>
                  <div className="text-xl font-semibold text-enel-green">{euro(migliorEnel.totaleBolletta)}</div>
                </div>
                <div className="rounded-lg border border-enel-line p-4">
                  <div className="text-xs text-enel-ink/60 mb-1">{nomeFornitore || 'Concorrente'}</div>
                  <div className="text-xl font-semibold">{euro(risultatoConcorrente.totaleBolletta)}</div>
                </div>
              </div>

              {totaleDichiarato !== '' && (
                <div className="text-xs text-enel-ink/50 mb-4">
                  Scarto dal totale dichiarato in bolletta:{' '}
                  <span className="font-medium">{euro(risultatoConcorrente.totaleBolletta - Number(totaleDichiarato))}</span>{' '}
                  — utile per verificare la coerenza dei dati inseriti.
                </div>
              )}

              {risparmioAnnuo !== null && (
                <div
                  className={`rounded-lg p-4 text-sm font-medium ${
                    risparmioAnnuo > 0 ? 'bg-enel-green/10 text-enel-greenDark' : 'bg-enel-amber/10 text-enel-amber'
                  }`}
                >
                  {risparmioAnnuo > 0
                    ? `Con Enel il cliente risparmia circa ${euro(risparmioAnnuo)} l'anno rispetto a questa offerta concorrente.`
                    : `L'offerta concorrente costerebbe circa ${euro(-risparmioAnnuo)} in meno l'anno: valuta un'offerta Enel diversa o evidenzia altri punti di forza (assistenza, canale, flessibilità contrattuale).`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
