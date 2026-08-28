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
              <label className="label">Prezzo fisso (€/kWh o €/Smc)</label>
              <input type="number" step="0.00001" className="input" value={valori.prezzoFisso ?? 0} onChange={(e) => set('prezzoFisso', Number(e.target.value))} />
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
