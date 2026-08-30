'use client';

import { useEffect, useMemo, useState } from 'react';
import { PunMensile, OffertaConcorrente } from '@/lib/types';
import { PunChart, SerieAnnoPun } from '@/components/PunChart';

const MESI_NOME = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

function euroMwh(n: number) {
  return n.toLocaleString('it-IT', { maximumFractionDigits: 0 }) + ' €/MWh';
}
function euroKwh(n: number) {
  return (n / 1000).toLocaleString('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/kWh';
}

export function MercatoClient() {
  const [pun, setPun] = useState<PunMensile[]>([]);
  const [concorrenti, setConcorrenti] = useState<OffertaConcorrente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/pun').then((r) => r.json()),
      fetch('/api/concorrenti').then((r) => r.json())
    ]).then(([p, c]) => {
      setPun(p);
      setConcorrenti(c);
      setLoading(false);
    });
  }, []);

  const ultimo = useMemo(() => {
    if (pun.length === 0) return null;
    return [...pun].sort((a, b) => (a.anno === b.anno ? b.mese - a.mese : b.anno - a.anno))[0];
  }, [pun]);

  // Confronto con lo stesso mese negli anni precedenti: utile per un
  // consulente che ha davanti un cliente il cui contratto scade adesso, per
  // capire a che PUN aveva sottoscritto 1 o 2 anni fa rispetto a oggi.
  const confrontoAnniPrecedenti = useMemo(() => {
    if (!ultimo) return [];
    return [1, 2]
      .map((indietro) => {
        const anno = ultimo.anno - indietro;
        const trovato = pun.find((p) => p.anno === anno && p.mese === ultimo.mese);
        return trovato ? { anniFa: indietro, anno, valore: trovato.valoreMwh } : null;
      })
      .filter((x): x is { anniFa: number; anno: number; valore: number } => x !== null);
  }, [pun, ultimo]);

  const serieChart: SerieAnnoPun[] = useMemo(() => {
    const anni = Array.from(new Set(pun.map((p) => p.anno))).sort((a, b) => a - b);
    return anni.map((anno) => {
      const valori: (number | null)[] = Array(12).fill(null);
      const stimati: boolean[] = Array(12).fill(false);
      pun
        .filter((p) => p.anno === anno)
        .forEach((p) => {
          valori[p.mese - 1] = p.valoreMwh;
          stimati[p.mese - 1] = p.stimato;
        });
      return { anno, valori, stimati };
    });
  }, [pun]);

  const concorrentiWeb = concorrenti.filter((c) => c.canale === 'WEB');
  const concorrentiAltro = concorrenti.filter((c) => c.canale !== 'WEB');
  const ciSonoStimati = pun.some((p) => p.stimato);

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Mercato dell'energia</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Contesto sul mercato all'ingrosso e sulla concorrenza, pensato per capire meglio le offerte che proponi:
        cos'è il PUN, come si è mosso nel tempo, e a che punto sono le principali offerte concorrenti.
      </p>

      {/* Sezione didattica */}
      <div className="card p-5 mb-6">
        <div className="text-sm font-semibold mb-2">Cos'è il PUN, in breve</div>
        <p className="text-sm text-enel-ink/70 leading-relaxed mb-3">
          Il <strong>PUN (Prezzo Unico Nazionale)</strong>, oggi pubblicato come <strong>PUN Index GME</strong>, è il
          prezzo di riferimento dell'energia elettrica scambiata all'ingrosso sulla Borsa elettrica italiana. Viene
          calcolato ogni giorno e pubblicato come media mensile dal GME (Gestore dei Mercati Energetici). Non è un
          prezzo che paga il cliente finale direttamente: è la base su cui i fornitori costruiscono sia le offerte a
          <strong> prezzo fisso</strong> (bloccato per tutta la durata del contratto, indipendente dal PUN) sia quelle
          a <strong> prezzo variabile/indicizzato</strong> (che seguono il PUN mese per mese, di solito PUN + uno
          spread fisso, a volte con un CAP che limita il rialzo massimo).
        </p>
        <p className="text-sm text-enel-ink/70 leading-relaxed">
          Perché è utile guardarlo: se il PUN è in una fase di discesa, un'offerta indicizzata può convenire di più
          nel breve periodo; se è in salita o instabile, un prezzo fisso protegge il cliente da rincari imprevisti.
          Il grafico sotto confronta più anni per capire anche se il periodo attuale è caro o economico rispetto al
          passato — utile in particolare quando un cliente ha il contratto in scadenza: guardare a che livello di
          PUN aveva sottoscritto (1 o 2 anni fa, stesso mese) aiuta a impostare la conversazione sul rinnovo.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-enel-ink/50">Caricamento dati di mercato…</div>
      ) : (
        <>
          {/* Lettura corrente + confronto anni precedenti */}
          {ultimo && (
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="card p-5">
                <div className="text-xs text-enel-ink/50 uppercase tracking-wide mb-1">
                  PUN {MESI_NOME[ultimo.mese - 1]} {ultimo.anno}
                  {ultimo.stimato && <span className="text-enel-amber"> · stima</span>}
                </div>
                <div className="text-2xl font-semibold text-enel-navy">{euroMwh(ultimo.valoreMwh)}</div>
                <div className="text-xs text-enel-ink/50 mt-1">{euroKwh(ultimo.valoreMwh)}</div>
              </div>
              {confrontoAnniPrecedenti.map((c) => {
                const delta = ultimo.valoreMwh - c.valore;
                const percento = (delta / c.valore) * 100;
                return (
                  <div className="card p-5" key={c.anniFa}>
                    <div className="text-xs text-enel-ink/50 uppercase tracking-wide mb-1">
                      Stesso mese {c.anniFa === 1 ? '1 anno fa' : '2 anni fa'} ({c.anno})
                    </div>
                    <div className="text-2xl font-semibold">{euroMwh(c.valore)}</div>
                    <div className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-red-600' : 'text-enel-green'}`}>
                      {delta >= 0 ? '+' : ''}
                      {percento.toFixed(0)}% rispetto ad oggi
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grafico multi-anno */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Andamento PUN mensile — confronto tra anni</div>
            </div>
            {serieChart.length > 0 ? (
              <PunChart serie={serieChart} />
            ) : (
              <div className="text-xs text-enel-ink/40">
                Nessun dato ancora caricato: lancia il seed (endpoint /api/seed/mercato?key=…) da Admin.
              </div>
            )}
            <p className="text-[11px] text-enel-ink/40 mt-3">
              Valori medi mensili in €/MWh.{' '}
              {ciSonoStimati && 'I tratti tratteggiati indicano mesi stimati/da fonte secondaria, in attesa di conferma dal sito ufficiale GME. '}
              Fonte: PUN Index GME, elaborazione interna aggiornabile da Admin → "PUN mensile".
            </p>
          </div>

          {/* Offerte concorrenti */}
          <div className="card p-5">
            <div className="text-sm font-semibold mb-1">Offerte concorrenti — riferimento indicativo</div>
            <p className="text-xs text-enel-ink/50 mb-4">
              Prezzi raccolti manualmente dal team commerciale, non da una fonte pubblica automatica: verificane
              sempre l'aggiornamento prima di usarli con un cliente.{' '}
              <strong>Le offerte "solo web" hanno condizioni spesso non replicabili</strong> in una trattativa
              telefonica o in negozio (attivazione autonoma, niente consulenza, a volte requisiti extra): non
              confrontarle come se fossero equivalenti a un'offerta commerciale diretta.
            </p>

            {concorrenti.length === 0 ? (
              <div className="text-xs text-enel-ink/40">
                Nessuna offerta concorrente inserita ancora. Usa il modulo qui sotto per segnalarne una.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-enel-ink/50 mb-2">
                    Offerte web ({concorrentiWeb.length})
                  </div>
                  <div className="space-y-2">
                    {concorrentiWeb.map((c) => (
                      <CardConcorrente key={c.id} c={c} />
                    ))}
                    {concorrentiWeb.length === 0 && <div className="text-xs text-enel-ink/40">Nessuna.</div>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-enel-ink/50 mb-2">
                    Altri canali ({concorrentiAltro.length})
                  </div>
                  <div className="space-y-2">
                    {concorrentiAltro.map((c) => (
                      <CardConcorrente key={c.id} c={c} />
                    ))}
                    {concorrentiAltro.length === 0 && <div className="text-xs text-enel-ink/40">Nessuna.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modulo di segnalazione, aperto a chiunque: nessun login richiesto */}
          <SegnalaOffertaForm />
        </>
      )}
    </div>
  );
}

function CardConcorrente({ c }: { c: OffertaConcorrente }) {
  return (
    <div className="border border-enel-line rounded-lg p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">{c.fornitore}</div>
        <div className="text-[10px] text-enel-ink/40 uppercase">{c.commodity}</div>
      </div>
      <div className="text-xs text-enel-ink/60">{c.nomeOfferta}</div>
      <div className="flex items-baseline justify-between mt-1.5">
        <span className="text-xs text-enel-ink/50">
          {c.tipoPrezzo === 'VARIABILE' ? 'Variabile (spread)' : 'Fisso'}
        </span>
        <span className="text-sm font-semibold">
          {c.prezzoKwh != null ? `${c.prezzoKwh.toFixed(4)} €/${c.commodity === 'GAS' ? 'Smc' : 'kWh'}` : '—'}
        </span>
      </div>
      {c.ccvMensile != null && <div className="text-[11px] text-enel-ink/40 text-right">CCV {c.ccvMensile.toFixed(2)} €/mese</div>}
      {c.sconto && <div className="text-[11px] text-enel-green mt-1">🏷 {c.sconto}</div>}
      {(c.durataDal || c.durataAl) && (
        <div className="text-[11px] text-enel-ink/40 mt-0.5">
          Valida dal {c.durataDal || '?'} al {c.durataAl || '?'}
        </div>
      )}
      {c.note && <div className="text-[11px] text-enel-ink/50 mt-1.5 italic">{c.note}</div>}
    </div>
  );
}

function SegnalaOffertaForm() {
  const [fornitore, setFornitore] = useState('');
  const [nomeOfferta, setNomeOfferta] = useState('');
  const [commodity, setCommodity] = useState<'LUCE' | 'GAS'>('LUCE');
  const [tipoPrezzo, setTipoPrezzo] = useState<'FISSO' | 'VARIABILE'>('FISSO');
  const [prezzoKwh, setPrezzoKwh] = useState<number | ''>('');
  const [ccvMensile, setCcvMensile] = useState<number | ''>('');
  const [sconto, setSconto] = useState('');
  const [durataDal, setDurataDal] = useState('');
  const [durataAl, setDurataAl] = useState('');
  const [canale, setCanale] = useState<'WEB' | 'ALTRO'>('ALTRO');
  const [nomeSegnalatore, setNomeSegnalatore] = useState('');
  const [cteBase64, setCteBase64] = useState<string | null>(null);
  const [cteNomeFile, setCteNomeFile] = useState<string | null>(null);
  const [stato, setStato] = useState<'idle' | 'invio' | 'ok' | 'errore'>('idle');

  function handleCte(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCteBase64(reader.result as string); // data URL completa, es. "data:image/jpeg;base64,...."
      setCteNomeFile(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function invia() {
    if (!fornitore || prezzoKwh === '') return;
    setStato('invio');
    try {
      const res = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornitore,
          nomeOfferta: nomeOfferta || undefined,
          commodity,
          tipoPrezzo,
          prezzoKwh: Number(prezzoKwh),
          ccvMensile: ccvMensile === '' ? null : Number(ccvMensile),
          sconto: sconto || null,
          durataDal: durataDal || null,
          durataAl: durataAl || null,
          canale,
          cteBase64,
          nomeSegnalatore: nomeSegnalatore || undefined
        })
      });
      if (!res.ok) {
        setStato('errore');
        return;
      }
      setStato('ok');
      setFornitore('');
      setNomeOfferta('');
      setPrezzoKwh('');
      setCcvMensile('');
      setSconto('');
      setDurataDal('');
      setDurataAl('');
      setCteBase64(null);
      setCteNomeFile(null);
    } catch {
      setStato('errore');
    }
  }

  return (
    <div className="card p-5 mt-6">
      <div className="text-sm font-semibold mb-1">Segnala un'offerta concorrente</div>
      <p className="text-xs text-enel-ink/50 mb-4">
        Aperto a chiunque, nessun accesso richiesto. Hai visto un prezzo concorrente su una bolletta reale o
        un'offerta pubblicata? Segnalalo qui: un amministratore verifica prima che compaia sopra in questa pagina.
        Allega una foto della bolletta o della schermata dell'offerta come conferma, se puoi.
      </p>

      <div className="grid sm:grid-cols-4 gap-3 mb-3">
        <input className="input text-sm sm:col-span-2" placeholder="Fornitore *" value={fornitore} onChange={(e) => setFornitore(e.target.value)} />
        <select className="input text-sm" value={commodity} onChange={(e) => setCommodity(e.target.value as 'LUCE' | 'GAS')}>
          <option value="LUCE">Luce</option>
          <option value="GAS">Gas</option>
        </select>
        <select className="input text-sm" value={tipoPrezzo} onChange={(e) => setTipoPrezzo(e.target.value as 'FISSO' | 'VARIABILE')}>
          <option value="FISSO">Fisso</option>
          <option value="VARIABILE">Variabile</option>
        </select>
        <input
          className="input text-sm sm:col-span-2"
          placeholder="Nome offerta (opzionale)"
          value={nomeOfferta}
          onChange={(e) => setNomeOfferta(e.target.value)}
        />
        <input
          type="number"
          step="0.0001"
          className="input text-sm"
          placeholder={`Prezzo €/${commodity === 'GAS' ? 'Smc' : 'kWh'} *`}
          value={prezzoKwh}
          onChange={(e) => setPrezzoKwh(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <input
          type="number"
          step="0.01"
          className="input text-sm"
          placeholder="CCV €/mese"
          value={ccvMensile}
          onChange={(e) => setCcvMensile(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <input
          className="input text-sm sm:col-span-2"
          placeholder="Sconto/promozione (es. -10% primi 12 mesi)"
          value={sconto}
          onChange={(e) => setSconto(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-enel-ink/50 whitespace-nowrap">Dal</label>
          <input type="date" className="input text-sm" value={durataDal} onChange={(e) => setDurataDal(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-enel-ink/50 whitespace-nowrap">Al</label>
          <input type="date" className="input text-sm" value={durataAl} onChange={(e) => setDurataAl(e.target.value)} />
        </div>
        <select className="input text-sm" value={canale} onChange={(e) => setCanale(e.target.value as 'WEB' | 'ALTRO')}>
          <option value="ALTRO">Vista di persona / bolletta reale</option>
          <option value="WEB">Offerta solo web</option>
        </select>
        <input className="input text-sm" placeholder="Il tuo nome (opzionale)" value={nomeSegnalatore} onChange={(e) => setNomeSegnalatore(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="label">Allega CTE / foto bolletta come conferma (opzionale, consigliato)</label>
        <input type="file" accept="image/*,.pdf" capture="environment" className="input text-sm" onChange={handleCte} />
        {cteNomeFile && <div className="text-xs text-enel-green mt-1">✓ Allegato: {cteNomeFile}</div>}
      </div>

      <button className="btn-primary text-sm w-full sm:w-auto" onClick={invia} disabled={!fornitore || prezzoKwh === '' || stato === 'invio'}>
        {stato === 'invio' ? 'Invio…' : '📩 Invia segnalazione'}
      </button>
      {stato === 'ok' && <div className="text-xs text-enel-green mt-2">Grazie! Segnalazione inviata, in attesa di verifica.</div>}
      {stato === 'errore' && <div className="text-xs text-red-600 mt-2">Invio non riuscito, riprova.</div>}
    </div>
  );
}
