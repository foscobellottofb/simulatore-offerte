'use client';

import { useEffect, useState } from 'react';
import { Offerta, ParametroDettaglio, ArgomentoVendita, TipoArgomento, FasciaRete, PunMensile, PsvMensile, OffertaConcorrente } from '@/lib/types';
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
  const [psv, setPsv] = useState<PsvMensile[]>([]);
  const [concorrenti, setConcorrenti] = useState<OffertaConcorrente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvandoRete, setSalvandoRete] = useState(false);
  const [salvandoPun, setSalvandoPun] = useState(false);
  const [salvandoPsv, setSalvandoPsv] = useState(false);
  const [sincronizzandoPun, setSincronizzandoPun] = useState(false);
  const [sincronizzandoPsv, setSincronizzandoPsv] = useState(false);
  const [sincronizzandoConcorrenti, setSincronizzandoConcorrenti] = useState(false);
  const [mesiPun, setMesiPun] = useState(18);
  const [mesiPsv, setMesiPsv] = useState(18);
  const [contiConcorrenti, setContiConcorrenti] = useState({ web: 0, fisso: 8, variabile: 8 });
  const [progressoConcorrenti, setProgressoConcorrenti] = useState<string | null>(null);
  const [tab, setTab] = useState<'offerte' | 'parametri' | 'rete' | 'pun' | 'psv' | 'concorrenza' | 'argomentario'>('offerte');
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
    fetch('/api/psv').then((r) => r.json()).then(setPsv);
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
      const res = await fetch('/api/pun/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesi: mesiPun })
      });
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

  function aggiornaPsv(id: string, valoreSmc: number) {
    setPsv((prev) => prev.map((p) => (p.id === id ? { ...p, valoreSmc } : p)));
  }

  async function salvaPsv() {
    setSalvandoPsv(true);
    await fetch('/api/psv', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(psv.map((p) => ({ id: p.id, valoreSmc: p.valoreSmc })))
    });
    setSalvandoPsv(false);
  }

  async function aggiungiMesePsv() {
    const meseStr = prompt('Mese e anno, formato MM-AAAA (es. 09-2026):');
    if (!meseStr) return;
    const match = meseStr.trim().match(/^(\d{1,2})-(\d{4})$/);
    if (!match) {
      alert('Formato non valido, usa MM-AAAA (es. 09-2026).');
      return;
    }
    const mese = Number(match[1]);
    const anno = Number(match[2]);
    const valoreStr = prompt('Valore PSV in €/Smc:');
    if (!valoreStr) return;
    const res = await fetch('/api/psv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anno, mese, valoreSmc: Number(valoreStr) })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Errore nel salvataggio.');
      return;
    }
    const nuovo = await res.json();
    setPsv((prev) => [...prev.filter((p) => !(p.anno === anno && p.mese === mese)), nuovo]);
  }

  async function sincronizzaPsvDalWeb() {
    setSincronizzandoPsv(true);
    try {
      const res = await fetch('/api/psv/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesi: mesiPsv })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Sincronizzazione non riuscita.');
        return;
      }
      alert(data.messaggio);
      fetch('/api/psv').then((r) => r.json()).then(setPsv);
    } finally {
      setSincronizzandoPsv(false);
    }
  }

  const FORNITORI_RICERCA = [
    'A2A', 'Iren', 'Edison', 'Eni Plenitude', 'Sorgenia', 'Acea', 'Hera Comm',
    'Engie', 'Illumia', 'Wekiwi', 'Octopus Energy', 'Green Network', 'NeN', 'Dolomiti Energia'
  ];
  // Deve corrispondere a MAX_RICERCHE_PER_CHIAMATA in app/api/concorrenti/sync/route.ts
  // (qui serve solo per mostrare la stima all'utente prima di partire).
  const MAX_RICERCHE_ADMIN = 4;

  const [testandoOpenData, setTestandoOpenData] = useState(false);
  const [risultatoOpenData, setRisultatoOpenData] = useState<any>(null);

  async function testaAccessoOpenData() {
    setTestandoOpenData(true);
    setRisultatoOpenData(null);
    try {
      const res = await fetch('/api/concorrenti/opendata-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        setRisultatoOpenData({ ok: false, errore: 'Risposta non-JSON dal server (vedi Vercel logs per dettagli).' });
        return;
      }
      setRisultatoOpenData(data);
    } catch (err) {
      setRisultatoOpenData({ ok: false, errore: err instanceof Error ? err.message : String(err) });
    } finally {
      setTestandoOpenData(false);
    }
  }

  async function cercaConcorrentiDalWeb() {
    const confermato = window.confirm(
      `Stai per lanciare fino a 14 chiamate (una per fornitore), ciascuna con un tetto di ${MAX_RICERCHE_ADMIN} ricerche web.\n\n` +
        `Costo massimo stimato: circa 1,5-2,5 € totali (con questo limite tecnico ora attivo, non può più superarlo di molto). ` +
        `Richiede qualche minuto.\n\nProcedere?`
    );
    if (!confermato) return;

    setSincronizzandoConcorrenti(true);
    // Budget residuo per categoria: si esaurisce man mano che i fornitori
    // trovano offerte, così ci si ferma appena raggiunti i totali richiesti
    // invece di continuare a interrogare fornitori inutilmente.
    let residuo = { web: contiConcorrenti.web, fisso: contiConcorrenti.fisso, variabile: contiConcorrenti.variabile };
    let totaleTrovate = 0;
    const falliti: string[] = [];

    try {
      for (const fornitore of FORNITORI_RICERCA) {
        if (residuo.web <= 0 && residuo.fisso <= 0 && residuo.variabile <= 0) break;

        setProgressoConcorrenti(`Cerco offerte di ${fornitore}… (${totaleTrovate} trovate finora)`);

        try {
          const res = await fetch('/api/concorrenti/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fornitore,
              webCount: residuo.web,
              fissoCount: residuo.fisso,
              variabileCount: residuo.variabile
            })
          });

          let data: any;
          try {
            data = await res.json();
          } catch {
            // Timeout/risposta non-JSON per QUESTO fornitore: la chiamata è
            // piccola, quindi è raro, ma se capita saltiamo al prossimo
            // invece di interrompere tutto il giro.
            falliti.push(fornitore);
            continue;
          }
          if (!res.ok) {
            falliti.push(fornitore);
            continue;
          }

          totaleTrovate += data.creati?.length ?? 0;
          if (data.contatori) {
            residuo = {
              web: Math.max(0, residuo.web - (data.contatori.web ?? 0)),
              fisso: Math.max(0, residuo.fisso - (data.contatori.fisso ?? 0)),
              variabile: Math.max(0, residuo.variabile - (data.contatori.variabile ?? 0))
            };
          }
        } catch {
          falliti.push(fornitore);
        }
      }

      alert(
        `Ricerca completata: ${totaleTrovate} offerte complete (prezzo+CCV) trovate e inserite come NON ATTIVE.\n` +
          `Verificale e attivale da Admin prima che compaiano su /mercato.` +
          (falliti.length > 0 ? `\n\nFalliti/saltati: ${falliti.join(', ')} (puoi rilanciare la ricerca, i fornitori già coperti restano nel database).` : '')
      );
      fetch('/api/concorrenti?includiInattive=1').then((r) => r.json()).then(setConcorrenti);
    } finally {
      setSincronizzandoConcorrenti(false);
      setProgressoConcorrenti(null);
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
        <button className={tab === 'psv' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setTab('psv')}>
          PSV mensile ({psv.length})
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
                      {o.note && (
                        <div className="text-xs text-enel-amber font-normal mt-0.5 max-w-[220px]" title={o.note}>
                          ⚠ {o.note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{o.commodity}</td>
                    <td className="px-4 py-2.5">{o.tipoPrezzo}</td>
                    <td className="px-4 py-2.5 text-right">
                      {(o.prezzoFisso ?? o.cap ?? 0).toFixed(4)}
                      {o.prezzoF2 != null && (
                        <div className="text-xs text-enel-ink/50 font-normal">
                          F2 {o.prezzoF2.toFixed(4)}
                          {o.prezzoF3 != null && ` · F3 ${o.prezzoF3.toFixed(4)}`}
                        </div>
                      )}
                    </td>
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
            <div className="flex items-end gap-2 shrink-0">
              <div>
                <label className="text-[10px] text-enel-ink/50 block mb-0.5">Mesi da cercare</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  className="input text-xs py-1 px-2 w-16"
                  value={mesiPun}
                  onChange={(e) => setMesiPun(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
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

      {tab === 'psv' && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-xs text-enel-ink/50">
              Valore medio mensile dell'indice PSV gas (€/Smc), l'equivalente del PUN per il gas, usato nel grafico
              della pagina pubblica "/mercato". Aggiorna qui il mese corrente appena disponibile, o correggi valori
              stimati con quelli ufficiali.
            </p>
            <div className="flex items-end gap-2 shrink-0">
              <div>
                <label className="text-[10px] text-enel-ink/50 block mb-0.5">Mesi da cercare</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  className="input text-xs py-1 px-2 w-16"
                  value={mesiPsv}
                  onChange={(e) => setMesiPsv(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={sincronizzaPsvDalWeb} disabled={sincronizzandoPsv}>
                {sincronizzandoPsv ? 'Cerco…' : '🔎 Sincronizza da web'}
              </button>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={aggiungiMesePsv}>
                + Aggiungi mese
              </button>
            </div>
          </div>
          <p className="text-[11px] text-enel-ink/40 mb-4 -mt-2">
            "Sincronizza da web" chiede a Claude di cercare il dato ufficiale sul web e aggiorna i mesi trovati
            (consuma credito dell'account Anthropic collegato). I mesi aggiornati da fonte non certa restano
            marcati "stima": controllali comunque prima di un uso puntuale con un cliente.
          </p>
          {Array.from(new Set(psv.map((p) => p.anno))).sort((a, b) => b - a).map((anno) => (
            <div key={anno} className="mb-5">
              <div className="text-sm font-semibold mb-2">{anno}</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {psv
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
                        step="0.001"
                        className="input text-xs py-1 px-2"
                        value={p.valoreSmc}
                        onChange={(e) => aggiornaPsv(p.id, Number(e.target.value))}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {psv.length === 0 && (
            <div className="text-xs text-enel-ink/40 mb-4">
              Nessun dato: lancia il seed (endpoint /api/seed/mercato?key=…) per caricare la serie storica di
              partenza.
            </div>
          )}
          <button className="btn-primary text-sm mt-2" onClick={salvaPsv} disabled={salvandoPsv || psv.length === 0}>
            {salvandoPsv ? 'Salvataggio…' : 'Salva PSV mensile'}
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
              <br />
              <span className="text-enel-amber">
                ⚠️ "Cerca dal web" ora lancia una chiamata separata per ciascuno dei {FORNITORI_RICERCA.length}{' '}
                fornitori, in sequenza (necessario perché il piano Vercel Hobby limita ogni singola chiamata a
                ~10 secondi) — quindi la ricerca completa richiede qualche minuto invece di pochi secondi. Solo
                le offerte con SIA prezzo SIA CCV trovati vengono salvate.
              </span>
            </p>
            {progressoConcorrenti && (
              <div className="flex items-center gap-2 rounded-lg border border-enel-navy/30 bg-enel-navy/5 px-3 py-2 mb-3">
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full border-2 border-enel-navy/30 border-t-enel-navy animate-spin"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-enel-navy">{progressoConcorrenti}</span>
              </div>
            )}
            <div className="flex items-end gap-2 shrink-0">
              <div>
                <label className="text-[10px] text-enel-ink/50 block mb-0.5">Web (0 = nessuna)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input text-xs py-1 px-2 w-16"
                  value={contiConcorrenti.web}
                  onChange={(e) => setContiConcorrenti((c) => ({ ...c, web: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <label className="text-[10px] text-enel-ink/50 block mb-0.5">Prezzo fisso</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input text-xs py-1 px-2 w-16"
                  value={contiConcorrenti.fisso}
                  onChange={(e) => setContiConcorrenti((c) => ({ ...c, fisso: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <label className="text-[10px] text-enel-ink/50 block mb-0.5">Prezzo variabile</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input text-xs py-1 px-2 w-16"
                  value={contiConcorrenti.variabile}
                  onChange={(e) => setContiConcorrenti((c) => ({ ...c, variabile: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={cercaConcorrentiDalWeb} disabled={sincronizzandoConcorrenti}>
                {sincronizzandoConcorrenti ? 'Cerco…' : '🔎 Cerca dal web (a pagamento)'}
              </button>
              <button
                className="btn-secondary text-xs whitespace-nowrap"
                onClick={testaAccessoOpenData}
                disabled={testandoOpenData}
                title="Nessuna chiamata IA, nessun costo: prova solo a leggere i dati open data ufficiali ARERA"
              >
                {testandoOpenData ? 'Provo…' : '🧪 Testa Open Data ARERA (gratis)'}
              </button>
              <button className="btn-secondary text-xs whitespace-nowrap" onClick={aggiungiConcorrente}>
                + Aggiungi offerta
              </button>
            </div>
          </div>
          <p className="text-[11px] text-enel-ink/40 mb-4 -mt-2">
            "Cerca dal web" chiede a Claude di trovare offerte pubbliche online (consuma credito Anthropic): i
            risultati entrano <strong>non attivi</strong> e non compaiono su "/mercato" finché non li controlli e
            spunti "Attiva". "Testa Open Data ARERA" è invece gratuito: prova solo a leggere i dati aperti
            ufficiali di ilportaleofferte.it, senza IA — se funziona, costruiamo un importer a costo zero al posto
            della ricerca a pagamento.
          </p>
          {risultatoOpenData && (
            <div className="rounded-lg border border-enel-line bg-enel-paper p-3 mb-4 text-xs">
              <div className="font-semibold mb-1">
                {risultatoOpenData.ok ? '✅ Accesso riuscito' : '❌ Accesso fallito'}
                {risultatoOpenData.status && ` (status ${risultatoOpenData.status})`}
              </div>
              {risultatoOpenData.errore && <div className="text-red-600 mb-2">{risultatoOpenData.errore}</div>}
              {risultatoOpenData.linkCsvTrovati?.length > 0 && (
                <div className="mb-2">
                  <div className="text-enel-ink/60 mb-1">File CSV trovati nella pagina:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {risultatoOpenData.linkCsvTrovati.map((l: string, i: number) => (
                      <li key={i} className="break-all">{l}</li>
                    ))}
                  </ul>
                </div>
              )}
              {risultatoOpenData.anteprimaContenuto && (
                <details>
                  <summary className="cursor-pointer text-enel-ink/60">Anteprima contenuto pagina (primi 3000 caratteri)</summary>
                  <pre className="whitespace-pre-wrap break-all bg-white border border-enel-line rounded p-2 mt-1 max-h-64 overflow-auto">
                    {risultatoOpenData.anteprimaContenuto}
                  </pre>
                </details>
              )}
            </div>
          )}
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
