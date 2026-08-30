'use client';

import { useEffect, useState } from 'react';
import { Offerta, ParametroDettaglio, ArgomentoVendita, TipoArgomento, FasciaRete, PunMensile, OffertaConcorrente } from '@/lib/types';
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
  const [pun, setPun] = useState<PunMensile[]>([]);
  const [concorrenti, setConcorrenti] = useState<OffertaConcorrente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvandoRete, setSalvandoRete] = useState(false);
  const [salvandoPun, setSalvandoPun] = useState(false);
  const [sincronizzandoPun, setSincronizzandoPun] = useState(false);
  const [sincronizzandoConcorrenti, setSincronizzandoConcorrenti] = useState(false);
  const [tab, setTab] = useState<'offerte' | 'parametri' | 'rete' | 'pun' | 'concorrenza' | 'argomentario'>('offerte');
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
    fetch('/api/pun').then((r) => r.json()).then(setPun);
    fetch('/api/concorrenti?includiInattive=1').then((r) => r.json()).then(setConcorrenti);
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

  async function aggiungiFascia() {
    const fascia = prompt('Codice fascia (es. BTA7):');
    if (!fascia || !fascia.trim()) return;
    const res = await fetch('/api/fasce-rete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fascia: fascia.trim() })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Errore nella creazione della fascia.');
      return;
    }
    const nuova = await res.json();
    setFasceRete((prev) => [...prev, nuova]);
  }

  async function eliminaFascia(id: string, fascia: string) {
    if (!confirm(`Eliminare la fascia ${fascia}? Le offerte che ricadono in questa fascia di potenza smetteranno di trovare i costi di rete corrispondenti.`)) return;
    await fetch(`/api/fasce-rete/${id}`, { method: 'DELETE' });
    setFasceRete((prev) => prev.filter((f) => f.id !== id));
  }

  function aggiornaPun(id: string, valoreMwh: number) {
    setPun((prev) => prev.map((p) => (p.id === id ? { ...p, valoreMwh } : p)));
  }

  async function salvaPun() {
    setSalvandoPun(true);
    await fetch('/api/pun', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pun.map((p) => ({ id: p.id, valoreMwh: p.valoreMwh })))
    });
    setSalvandoPun(false);
  }

  async function aggiungiMesePun() {
    const meseStr = prompt('Mese e anno, formato MM-AAAA (es. 09-2026):');
    if (!meseStr) return;
    const match = meseStr.trim().match(/^(\d{1,2})-(\d{4})$/);
    if (!match) {
      alert('Formato non valido, usa MM-AAAA (es. 09-2026).');
      return;
    }
    const mese = Number(match[1]);
    const anno = Number(match[2]);
    const valoreStr = prompt('Valore PUN in €/MWh:');
    if (!valoreStr) return;
    const res = await fetch('/api/pun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anno, mese, valoreMwh: Number(valoreStr) })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Errore nel salvataggio.');
      return;
    }
    const nuovo = await res.json();
    setPun((prev) => [...prev.filter((p) => !(p.anno === anno && p.mese === mese)), nuovo]);
  }

  async function sincronizzaPunDalWeb() {
    setSincronizzandoPun(true);
    try {
      const res = await fetch('/api/pun/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Sincronizzazione non riuscita.');
        return;
      }
      alert(data.messaggio);
      fetch('/api/pun').then((r) => r.json()).then(setPun);
    } finally {
      setSincronizzandoPun(false);
    }
  }

  async function cercaConcorrentiDalWeb() {
    setSincronizzandoConcorrenti(true);
    try {
      const res = await fetch('/api/concorrenti/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Ricerca non riuscita.');
        return;
      }
      alert(data.messaggio);
      fetch('/api/concorrenti?includiInattive=1').then((r) => r.json()).then(setConcorrenti);
    } finally {
      setSincronizzandoConcorrenti(false);
    }
  }

  function aggiornaCampoConcorrente(id: string, campo: keyof OffertaConcorrente, valore: string | number | boolean) {
    setConcorrenti((prev) => prev.map((c) => (c.id === id ? { ...c, [campo]: valore } : c)));
  }

  function corpoPatchConcorrente(c: OffertaConcorrente) {
    return {
      fornitore: c.fornitore,
      nomeOfferta: c.nomeOfferta,
      commodity: c.commodity,
      tipoPrezzo: c.tipoPrezzo,
      prezzoKwh: c.prezzoKwh,
      ccvMensile: c.ccvMensile,
      sconto: c.sconto,
      durataDal: c.durataDal,
      durataAl: c.durataAl,
      canale: c.canale,
      note: c.note,
      attiva: c.attiva
    };
  }

  async function salvaConcorrente(id: string) {
    const c = concorrenti.find((x) => x.id === id);
    if (!c) return;
    await fetch(`/api/concorrenti/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoPatchConcorrente(c))
    });
  }

  // Per checkbox/select: aggiorna e salva SUBITO usando la riga corrente "c"
  // passata dal render, non lo stato React (che non si è ancora aggiornato
  // nello stesso istante in cui viene innescato il salvataggio — altrimenti
  // il salvataggio partiva con i valori vecchi, prima della modifica).
  async function salvaCampoImmediato(c: OffertaConcorrente, campo: keyof OffertaConcorrente, valore: string | number | boolean) {
    const aggiornato = { ...c, [campo]: valore } as OffertaConcorrente;
    setConcorrenti((prev) => prev.map((x) => (x.id === c.id ? aggiornato : x)));
    await fetch(`/api/concorrenti/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoPatchConcorrente(aggiornato))
    });
  }

  async function eliminaConcorrente(id: string) {
    if (!confirm('Eliminare questa offerta concorrente?')) return;
    await fetch(`/api/concorrenti/${id}`, { method: 'DELETE' });
    setConcorrenti((prev) => prev.filter((c) => c.id !== id));
  }

  async function aggiungiConcorrente() {
    const res = await fetch('/api/concorrenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fornitore: 'Nuovo fornitore',
        nomeOfferta: 'Nome offerta',
        commodity: 'LUCE',
        tipoPrezzo: 'FISSO',
        prezzoKwh: 0,
        ccvMensile: 0,
        canale: 'ALTRO',
        ordinamento: 99
      })
    });
    const nuovo = await res.json();
    setConcorrenti((prev) => [...prev, nuovo]);
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
        <button className={tab === 'pun' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('pun')}>
          PUN mensile ({pun.length})
        </button>
        <button className={tab === 'concorrenza' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('concorrenza')}>
          Concorrenza ({concorrenti.length})
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
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-xs text-enel-ink/50">
              Componenti ARERA di distribuzione e oneri di sistema (ASOS/ARIM), una riga per fascia di potenza. Gli
              oneri ASOS/ARIM cambiano ogni trimestre con delibera ARERA: aggiornali qui, senza toccare il codice.
              Trasmissione, misura e accisa (comuni a tutte le fasce) sono invece nella tab "Parametri di dettaglio".
            </p>
            <button className="btn-secondary text-xs whitespace-nowrap" onClick={aggiungiFascia}>
              + Aggiungi fascia
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-[1500px] w-full">
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
                  <th className="px-3 py-2"></th>
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
                          step="0.000001"
                          className="input w-32 text-right text-xs py-1 px-2"
                          value={f[campo] as number}
                          onChange={(e) => aggiornaFascia(f.id, campo, Number(e.target.value))}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button className="text-xs text-red-600 hover:underline" onClick={() => eliminaFascia(f.id, f.fascia)}>
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fasceRete.length === 0 && (
            <div className="text-xs text-enel-ink/40 mt-4">
              Nessuna fascia trovata: lancia il seed (endpoint /api/seed?key=…) per caricare i valori di partenza, o
              usa "+ Aggiungi fascia" per crearne una a mano.
            </div>
          )}
          <button className="btn-primary text-sm mt-4" onClick={salvaFasceRete} disabled={salvandoRete || fasceRete.length === 0}>
            {salvandoRete ? 'Salvataggio…' : 'Salva rete e oneri'}
          </button>
        </div>
      )}

      {tab === 'pun' && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-xs text-enel-ink/50">
              Valore medio mensile del PUN Index GME (€/MWh), usato nel grafico della pagina pubblica "/mercato".
              Aggiorna qui il mese corrente appena il GME lo pubblica (di solito nei primi giorni del mese
              successivo), o correggi valori stimati con quelli ufficiali.
            </p>
            <div className="flex gap-2 shrink-0">
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={sincronizzaPunDalWeb} disabled={sincronizzandoPun}>
                {sincronizzandoPun ? 'Cerco…' : '🔎 Sincronizza da web'}
              </button>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={aggiungiMesePun}>
                + Aggiungi mese
              </button>
            </div>
          </div>
          <p className="text-[11px] text-enel-ink/40 mb-4 -mt-2">
            "Sincronizza da web" chiede a Claude di cercare il dato ufficiale sul web e aggiorna i mesi trovati
            (consuma credito dell'account Anthropic collegato). I mesi aggiornati da fonte non certa restano
            marcati "stima": controllali comunque prima di un uso puntuale con un cliente.
          </p>
          {Array.from(new Set(pun.map((p) => p.anno))).sort((a, b) => b - a).map((anno) => (
            <div key={anno} className="mb-5">
              <div className="text-sm font-semibold mb-2">{anno}</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {pun
                  .filter((p) => p.anno === anno)
                  .sort((a, b) => a.mese - b.mese)
                  .map((p) => (
                    <div key={p.id} className="border border-enel-line rounded-lg p-2">
                      <div className="text-[10px] text-enel-ink/50 mb-1">
                        {['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'][p.mese - 1]}
                        {p.stimato && <span className="text-enel-amber"> · stima</span>}
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        className="input text-xs py-1 px-2"
                        value={p.valoreMwh}
                        onChange={(e) => aggiornaPun(p.id, Number(e.target.value))}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {pun.length === 0 && (
            <div className="text-xs text-enel-ink/40 mb-4">
              Nessun dato: lancia il seed (endpoint /api/seed/mercato?key=…) per caricare la serie storica di
              partenza.
            </div>
          )}
          <button className="btn-primary text-sm mt-2" onClick={salvaPun} disabled={salvandoPun || pun.length === 0}>
            {salvandoPun ? 'Salvataggio…' : 'Salva PUN mensile'}
          </button>
        </div>
      )}

      {tab === 'concorrenza' && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-xs text-enel-ink/50">
              Offerte concorrenti indicative, mostrate nella pagina pubblica "/mercato" (solo quelle{' '}
              <strong>attive</strong>). Distingui sempre le offerte "solo web" (canale WEB) dalle altre (canale
              ALTRO), perché non sono condizioni replicabili in trattativa diretta.
            </p>
            <div className="flex gap-2 shrink-0">
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={cercaConcorrentiDalWeb} disabled={sincronizzandoConcorrenti}>
                {sincronizzandoConcorrenti ? 'Cerco…' : '🔎 Cerca dal web'}
              </button>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={aggiungiConcorrente}>
                + Aggiungi offerta
              </button>
            </div>
          </div>
          <p className="text-[11px] text-enel-ink/40 mb-4 -mt-2">
            "Cerca dal web" chiede a Claude di trovare offerte pubbliche online (consuma credito Anthropic): i
            risultati entrano <strong>non attivi</strong> e non compaiono su "/mercato" finché non li controlli e
            spunti "Attiva".
          </p>
          <div className="space-y-3">
            {concorrenti.map((c) => {
              const oggi = new Date().toISOString().slice(0, 10);
              const scaduta = !!c.durataAl && c.durataAl < oggi;
              return (
              <div key={c.id} className={`border rounded-lg p-3 ${!c.attiva || scaduta ? 'border-enel-amber bg-enel-amber/5' : 'border-enel-line'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={c.attiva}
                    onChange={(e) => salvaCampoImmediato(c, 'attiva', e.target.checked)}
                    title="Attiva (visibile su /mercato)"
                  />
                  <span className="text-[10px] uppercase tracking-wide text-enel-ink/40">
                    {!c.attiva
                      ? '⚠ Non attiva — nascosta'
                      : scaduta
                        ? `⏰ Scaduta il ${c.durataAl} — nascosta automaticamente`
                        : 'Attiva — visibile su /mercato'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-6 gap-2 mb-2">
                  <input
                    className="input text-xs py-1.5 px-2 sm:col-span-1"
                    placeholder="Fornitore"
                    value={c.fornitore}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'fornitore', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <input
                    className="input text-xs py-1.5 px-2 sm:col-span-2"
                    placeholder="Nome offerta"
                    value={c.nomeOfferta}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'nomeOfferta', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <select
                    className="input text-xs py-1.5 px-2"
                    value={c.commodity}
                    onChange={(e) => salvaCampoImmediato(c, 'commodity', e.target.value)}
                  >
                    <option value="LUCE">Luce</option>
                    <option value="GAS">Gas</option>
                  </select>
                  <select
                    className="input text-xs py-1.5 px-2"
                    value={c.tipoPrezzo}
                    onChange={(e) => salvaCampoImmediato(c, 'tipoPrezzo', e.target.value)}
                  >
                    <option value="FISSO">Fisso</option>
                    <option value="VARIABILE">Variabile</option>
                  </select>
                  <input
                    type="number"
                    step="0.0001"
                    className="input text-xs py-1.5 px-2"
                    placeholder={c.commodity === 'GAS' ? '€/Smc' : '€/kWh'}
                    value={c.prezzoKwh ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'prezzoKwh', Number(e.target.value))}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <select
                    className="input text-xs py-1.5 px-2"
                    value={c.canale}
                    onChange={(e) => salvaCampoImmediato(c, 'canale', e.target.value)}
                  >
                    <option value="WEB">Web</option>
                    <option value="ALTRO">Altro canale</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-6 gap-2 mb-2">
                  <input
                    type="number"
                    step="0.01"
                    className="input text-xs py-1.5 px-2"
                    placeholder="CCV €/mese"
                    value={c.ccvMensile ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'ccvMensile', Number(e.target.value))}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <input
                    className="input text-xs py-1.5 px-2 sm:col-span-2"
                    placeholder="Sconto/promo"
                    value={c.sconto ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'sconto', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <input
                    type="date"
                    className="input text-xs py-1.5 px-2"
                    value={c.durataDal ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'durataDal', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <input
                    type="date"
                    className="input text-xs py-1.5 px-2"
                    value={c.durataAl ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'durataAl', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  {c.cteBase64 && (
                    <a
                      href={c.cteBase64}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-enel-navy hover:underline self-center text-center border border-enel-line rounded-lg py-1.5"
                    >
                      📎 Vedi allegato
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input text-xs py-1.5 px-2 flex-1"
                    placeholder="Note (es. condizioni particolari, data rilevazione)"
                    value={c.note ?? ''}
                    onChange={(e) => aggiornaCampoConcorrente(c.id, 'note', e.target.value)}
                    onBlur={() => salvaConcorrente(c.id)}
                  />
                  <button className="text-xs text-red-600 hover:underline whitespace-nowrap" onClick={() => eliminaConcorrente(c.id)}>
                    Elimina
                  </button>
                </div>
              </div>
              );
            })}
            {concorrenti.length === 0 && (
              <div className="text-xs text-enel-ink/40">Nessuna offerta concorrente inserita. Usa "+ Aggiungi offerta".</div>
            )}
          </div>
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
