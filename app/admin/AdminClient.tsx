'use client';

import { useEffect, useState } from 'react';
import { Offerta, ParametroDettaglio, ArgomentoVendita, TipoArgomento, FasciaRete } from '@/lib/types';
import { OffertaForm } from './OffertaForm';

const ETICHETTE_TIPO: Record<TipoArgomento, string> = {
  ENEL_VINCE: 'Quando Enel è già più conveniente',
  CONCORRENTE_VARIABILE: 'Quando il concorrente ha prezzo variabile',
  CONCORRENTE_FISSO: 'Quando il concorrente ha prezzo fisso',
  GENERALE: 'Sempre disponibili (punti di forza generali)'
};

export function AdminClient() {
  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [argomenti, setArgomenti] = useState<ArgomentoVendita[]>([]);
  const [fasceRete, setFasceRete] = useState<FasciaRete[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvandoRete, setSalvandoRete] = useState(false);
  const [tab, setTab] = useState<'offerte' | 'parametri' | 'rete' | 'argomentario'>('offerte');
  const [formAperto, setFormAperto] = useState<'nuova' | Offerta | null>(null);

  function ricaricaOfferte() {
    fetch('/api/offerte').then((r) => r.json()).then(setOfferte);
  }
  function ricaricaArgomenti() {
    fetch('/api/argomenti').then((r) => r.json()).then(setArgomenti);
  }

  useEffect(() => {
    ricaricaOfferte();
    ricaricaArgomenti();
    fetch('/api/parametri').then((r) => r.json()).then(setParametri);
    fetch('/api/fasce-rete').then((r) => r.json()).then(setFasceRete);
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

  function aggiornaFascia(id: string, campo: keyof FasciaRete, valore: number) {
    setFasceRete((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valore } : f)));
  }

  async function salvaFasceRete() {
    setSalvandoRete(true);
    await fetch('/api/fasce-rete', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fasceRete)
    });
    setSalvandoRete(false);
  }

  async function disattivaOfferta(id: string) {
    if (!confirm('Disattivare questa offerta? Non comparirà più nel simulatore, ma resta nello storico.')) return;
    await fetch(`/api/offerte/${id}`, { method: 'DELETE' });
    setOfferte((prev) => prev.filter((o) => o.id !== id));
  }

  function aggiornaTestoArgomento(id: string, testo: string) {
    setArgomenti((prev) => prev.map((a) => (a.id === id ? { ...a, testo } : a)));
  }

  async function salvaTestoArgomento(id: string) {
    const a = argomenti.find((x) => x.id === id);
    if (!a) return;
    await fetch(`/api/argomenti/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testo: a.testo })
    });
  }

  async function toggleAttivoArgomento(id: string, attivo: boolean) {
    setArgomenti((prev) => prev.map((a) => (a.id === id ? { ...a, attivo } : a)));
    await fetch(`/api/argomenti/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attivo })
    });
  }

  async function eliminaArgomento(id: string) {
    if (!confirm('Eliminare questo argomento?')) return;
    await fetch(`/api/argomenti/${id}`, { method: 'DELETE' });
    setArgomenti((prev) => prev.filter((a) => a.id !== id));
  }

  async function aggiungiArgomento(tipo: TipoArgomento) {
    const res = await fetch('/api/argomenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, testo: 'Nuovo argomento — modifica questo testo', ordinamento: 99 })
    });
    const nuovo = await res.json();
    setArgomenti((prev) => [...prev, nuovo]);
  }

  const categorie = Array.from(new Set(parametri.map((p) => p.categoria)));
  const tipiArgomento: TipoArgomento[] = ['ENEL_VINCE', 'CONCORRENTE_VARIABILE', 'CONCORRENTE_FISSO', 'GENERALE'];

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dati e parametri</h1>
        <button
          className="text-xs text-enel-ink/50 hover:text-enel-ink hover:underline whitespace-nowrap mt-1"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
        >
          Esci
        </button>
      </div>
      <p className="text-sm text-enel-ink/60 mb-6">
        Qui aggiorni le offerte Enel, le voci di dettaglio (accise, IVA, oneri) e gli argomenti di vendita usati
        nella app, senza dover toccare il codice.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        <button className={tab === 'offerte' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('offerte')}>
          Offerte ({offerte.length})
        </button>
        <button className={tab === 'parametri' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('parametri')}>
          Parametri di dettaglio
        </button>
        <button className={tab === 'rete' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('rete')}>
          Rete e oneri ({fasceRete.length})
        </button>
        <button
          className={tab === 'argomentario' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
          onClick={() => setTab('argomentario')}
        >
          Argomentario ({argomenti.length})
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
            Le componenti che variano per fascia di potenza (distribuzione, ASOS, ARIM) sono nella tab "Rete e oneri".
          </div>
          <button className="btn-primary text-sm" onClick={salvaParametri} disabled={salvando}>
            {salvando ? 'Salvataggio…' : 'Salva parametri'}
          </button>
        </div>
      )}

      {tab === 'rete' && (
        <div className="card p-5">
          <p className="text-xs text-enel-ink/50 mb-4">
            Componenti ARERA di distribuzione e oneri di sistema (ASOS/ARIM), una riga per fascia di potenza. Gli
            oneri ASOS/ARIM cambiano ogni trimestre con delibera ARERA: aggiornali qui, senza toccare il codice.
            Trasmissione, misura e accisa (comuni a tutte le fasce) sono invece nella tab "Parametri di dettaglio".
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-[1100px] w-full">
              <thead className="bg-enel-navy text-white/80 uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Fascia</th>
                  <th className="text-right px-3 py-2">Distr. fissa<br />€/POD/anno</th>
                  <th className="text-right px-3 py-2">Distr. potenza<br />€/kW/anno</th>
                  <th className="text-right px-3 py-2">Distr. energia<br />€/kWh</th>
                  <th className="text-right px-3 py-2">ASOS fissa<br />€/POD/anno</th>
                  <th className="text-right px-3 py-2">ASOS potenza<br />€/kW/anno</th>
                  <th className="text-right px-3 py-2">ASOS energia<br />€/kWh</th>
                  <th className="text-right px-3 py-2">ARIM fissa<br />€/POD/anno</th>
                  <th className="text-right px-3 py-2">ARIM potenza<br />€/kW/anno</th>
                  <th className="text-right px-3 py-2">ARIM energia<br />€/kWh</th>
                </tr>
              </thead>
              <tbody>
                {fasceRete.map((f) => (
                  <tr key={f.id} className="border-t border-enel-line">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {f.fascia}
                      <div className="text-[10px] text-enel-ink/40 font-normal">{f.etichetta}</div>
                    </td>
                    {(
                      [
                        'distribuzioneFissaAnno',
                        'distribuzionePotenzaAnno',
                        'distribuzioneEnergiaKwh',
                        'asosFissaAnno',
                        'asosPotenzaAnno',
                        'asosEnergiaKwh',
                        'arimFissaAnno',
                        'arimPotenzaAnno',
                        'arimEnergiaKwh'
                      ] as const
                    ).map((campo) => (
                      <td key={campo} className="px-1.5 py-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          className="input w-24 text-right text-xs py-1"
                          value={f[campo] as number}
                          onChange={(e) => aggiornaFascia(f.id, campo, Number(e.target.value))}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fasceRete.length === 0 && (
            <div className="text-xs text-enel-ink/40 mt-4">
              Nessuna fascia trovata: lancia il seed (endpoint /api/seed?key=…) per caricare i valori di partenza.
            </div>
          )}
          <button className="btn-primary text-sm mt-4" onClick={salvaFasceRete} disabled={salvandoRete || fasceRete.length === 0}>
            {salvandoRete ? 'Salvataggio…' : 'Salva rete e oneri'}
          </button>
        </div>
      )}

      {tab === 'argomentario' && (
        <div className="space-y-6">
          <p className="text-xs text-enel-ink/50">
            Questi testi compaiono nella pagina "Confronto concorrenza" per aiutare il consulente. Le modifiche al
            testo si salvano cliccando fuori dal campo (o Tab); l'interruttore attiva/disattiva un argomento senza
            eliminarlo.
          </p>
          {tipiArgomento.map((tipo) => (
            <div key={tipo} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">{ETICHETTE_TIPO[tipo]}</div>
                <button className="text-xs text-enel-navy hover:underline" onClick={() => aggiungiArgomento(tipo)}>
                  + Aggiungi
                </button>
              </div>
              <div className="space-y-3">
                {argomenti
                  .filter((a) => a.tipo === tipo)
                  .map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={a.attivo}
                        onChange={(e) => toggleAttivoArgomento(a.id, e.target.checked)}
                        className="mt-2"
                        title="Attivo"
                      />
                      <textarea
                        className={`input flex-1 ${!a.attivo ? 'opacity-40' : ''}`}
                        rows={2}
                        value={a.testo}
                        onChange={(e) => aggiornaTestoArgomento(a.id, e.target.value)}
                        onBlur={() => salvaTestoArgomento(a.id)}
                      />
                      <button className="text-xs text-red-600 hover:underline mt-2" onClick={() => eliminaArgomento(a.id)}>
                        Elimina
                      </button>
                    </div>
                  ))}
                {argomenti.filter((a) => a.tipo === tipo).length === 0 && (
                  <div className="text-xs text-enel-ink/40">Nessun argomento in questa categoria.</div>
                )}
              </div>
            </div>
          ))}
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
