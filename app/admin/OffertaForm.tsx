'use client';

import { useState } from 'react';
import { Offerta, Commodity, TipoPrezzo } from '@/lib/types';

type FormValues = Partial<Offerta>;

const VUOTO: FormValues = {
  nome: '',
  commodity: 'LUCE',
  tipoPrezzo: 'FISSO',
  potenzaMinKw: 0,
  potenzaMaxKw: 25,
  prezzoFisso: 0,
  parametroAlfa: null,
  cap: null,
  ccvMensile: 0,
  durataMesi: 24,
  disponibileTablet: true,
  disponibileCartaceo: false,
  canalePreferenziale: 'Tablet',
  vendibilita: 'SINGLE / DUAL / MULTI',
  strutturaPrezzo: 'Monoraria',
  richiedeContatore2G: false,
  note: ''
};

export function OffertaForm({
  offerta,
  onClose,
  onSaved
}: {
  offerta: Offerta | null; // null = nuova offerta
  onClose: () => void;
  onSaved: () => void;
}) {
  const [valori, setValori] = useState<FormValues>(offerta ?? VUOTO);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  function set<K extends keyof FormValues>(campo: K, valore: FormValues[K]) {
    setValori((prev) => ({ ...prev, [campo]: valore }));
  }

  async function salva() {
    setSalvando(true);
    setErrore(null);
    try {
      const url = offerta ? `/api/offerte/${offerta.id}` : '/api/offerte';
      const method = offerta ? 'PATCH' : 'POST';
      const { id, createdAt, updatedAt, ...payload } = valori as any;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Salvataggio non riuscito');
      onSaved();
      onClose();
    } catch (e) {
      setErrore('Non sono riuscito a salvare. Controlla i campi obbligatori (nome, prezzo, CCV).');
    } finally {
      setSalvando(false);
    }
  }

  const variabile = valori.tipoPrezzo === 'VARIABILE_CAP';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-base">{offerta ? 'Modifica offerta' : 'Nuova offerta'}</div>
          <button onClick={onClose} className="text-enel-ink/40 hover:text-enel-ink text-sm">
            Chiudi
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nome offerta</label>
            <input className="input" value={valori.nome ?? ''} onChange={(e) => set('nome', e.target.value)} />
          </div>

          <div>
            <label className="label">Commodity</label>
            <select className="input" value={valori.commodity} onChange={(e) => set('commodity', e.target.value as Commodity)}>
              <option value="LUCE">Luce</option>
              <option value="GAS">Gas</option>
            </select>
          </div>

          <div>
            <label className="label">Tipo prezzo</label>
            <select className="input" value={valori.tipoPrezzo} onChange={(e) => set('tipoPrezzo', e.target.value as TipoPrezzo)}>
              <option value="FISSO">Fisso</option>
              <option value="VARIABILE_CAP">Variabile con CAP</option>
              <option value="PERSONALIZZATA">Personalizzata</option>
            </select>
          </div>

          {valori.commodity === 'LUCE' && (
            <>
              <div>
                <label className="label">Potenza minima kW</label>
                <input type="number" className="input" value={valori.potenzaMinKw ?? 0} onChange={(e) => set('potenzaMinKw', Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Potenza massima kW</label>
                <input type="number" className="input" value={valori.potenzaMaxKw ?? 25} onChange={(e) => set('potenzaMaxKw', Number(e.target.value))} />
              </div>
            </>
          )}

          {!variabile ? (
            <div>
              <label className="label">Prezzo F1 (€/kWh o €/Smc)</label>
              <input type="number" step="0.00001" className="input" value={valori.prezzoFisso ?? 0} onChange={(e) => set('prezzoFisso', Number(e.target.value))} />
              <div className="text-[11px] text-enel-ink/40 mt-1">
                Per le offerte con un solo prezzo (la maggior parte), è l'unico prezzo da compilare: F2/F3 sotto
                restano vuoti.
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Parametro alfa</label>
                <input type="number" step="0.00001" className="input" value={valori.parametroAlfa ?? 0} onChange={(e) => set('parametroAlfa', Number(e.target.value))} />
              </div>
              <div>
                <label className="label">CAP</label>
                <input type="number" step="0.00001" className="input" value={valori.cap ?? 0} onChange={(e) => set('cap', Number(e.target.value))} />
              </div>
            </>
          )}

          <div>
            <label className="label">CCV mensile (€)</label>
            <input type="number" step="0.01" className="input" value={valori.ccvMensile ?? 0} onChange={(e) => set('ccvMensile', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Durata mesi</label>
            <input type="number" className="input" value={valori.durataMesi ?? 24} onChange={(e) => set('durataMesi', Number(e.target.value))} />
          </div>

          <div>
            <label className="label">Vendibilità</label>
            <input className="input" value={valori.vendibilita ?? ''} onChange={(e) => set('vendibilita', e.target.value)} placeholder="SINGLE / DUAL / MULTI" />
          </div>
          <div>
            <label className="label">Canale preferenziale</label>
            <input className="input" value={valori.canalePreferenziale ?? ''} onChange={(e) => set('canalePreferenziale', e.target.value)} placeholder="Tablet" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={!!valori.disponibileTablet} onChange={(e) => set('disponibileTablet', e.target.checked)} />
            <span className="text-sm">Disponibile Tablet</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={!!valori.disponibileCartaceo} onChange={(e) => set('disponibileCartaceo', e.target.checked)} />
            <span className="text-sm">Disponibile cartaceo</span>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:col-span-2">
            <input type="checkbox" checked={!!valori.richiedeContatore2G} onChange={(e) => set('richiedeContatore2G', e.target.checked)} />
            <span className="text-sm">Richiede contatore 2G</span>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-enel-line">
            <div className="text-sm font-medium mb-1">Fascia F2 (opzionale — solo offerte a più fasce, es. "Ore Happy")</div>
            <div className="text-xs text-enel-ink/50 mb-3">
              La maggior parte delle offerte ha un solo prezzo (F1 sopra): lascia questi campi vuoti. Alcune offerte
              hanno un secondo prezzo F2 valido solo in certe ore. Compila qui il prezzo F2 esatto e la fascia
              oraria — mantienilo così come scritto sulla scheda dell'offerta, non è derivato da F1. Nel Simulatore,
              chi la usa stimerà manualmente quanto consumo del cliente ricade in F2 (es. "20%"): il resto va in F1.
            </div>
          </div>
          <div>
            <label className="label">Ora inizio F2</label>
            <input
              type="number"
              min="0"
              max="23"
              className="input"
              value={valori.oreInizioF2 ?? ''}
              onChange={(e) => set('oreInizioF2', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 12"
            />
          </div>
          <div>
            <label className="label">Ora fine F2</label>
            <input
              type="number"
              min="0"
              max="23"
              className="input"
              value={valori.oreFineF2 ?? ''}
              onChange={(e) => set('oreFineF2', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 15"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Prezzo F2 (€/kWh o €/Smc)</label>
            <input
              type="number"
              step="0.00001"
              className="input"
              value={valori.prezzoF2 ?? ''}
              onChange={(e) => set('prezzoF2', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 0.08300 — copia il valore esatto dalla scheda dell'offerta"
            />
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-enel-line">
            <div className="text-sm font-medium mb-1">Fascia F3 (opzionale — solo offerte a 3 fasce)</div>
            <div className="text-xs text-enel-ink/50 mb-3">Stesso principio di F2, per offerte con una terza fascia oraria a prezzo diverso.</div>
          </div>
          <div>
            <label className="label">Ora inizio F3</label>
            <input
              type="number"
              min="0"
              max="23"
              className="input"
              value={valori.oreInizioF3 ?? ''}
              onChange={(e) => set('oreInizioF3', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 19"
            />
          </div>
          <div>
            <label className="label">Ora fine F3</label>
            <input
              type="number"
              min="0"
              max="23"
              className="input"
              value={valori.oreFineF3 ?? ''}
              onChange={(e) => set('oreFineF3', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 23"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Prezzo F3 (€/kWh o €/Smc)</label>
            <input
              type="number"
              step="0.00001"
              className="input"
              value={valori.prezzoF3 ?? ''}
              onChange={(e) => set('prezzoF3', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="es. 0.14200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Note (verifiche CTE, condizioni particolari...)</label>
            <textarea className="input" rows={2} value={valori.note ?? ''} onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>

        {errore && <div className="text-xs text-red-600 mt-3">{errore}</div>}

        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary text-sm" onClick={onClose}>
            Annulla
          </button>
          <button className="btn-primary text-sm" onClick={salva} disabled={salvando}>
            {salvando ? 'Salvataggio…' : 'Salva offerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
