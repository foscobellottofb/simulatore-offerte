'use client';

import { useEffect, useMemo, useState } from 'react';
import { Offerta, ParametroDettaglio, FasciaRete, Commodity, ArgomentoVendita } from '@/lib/types';
import { calcolaTutteLeOfferte, calcolaConcorrente } from '@/lib/calcoli';
import { Argomentario } from '@/components/Argomentario';

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function ConcorrenzaClient() {
  const [commodity, setCommodity] = useState<Commodity>('LUCE');
  const [tipoConsumo, setTipoConsumo] = useState<'ANNUO' | 'PERIODO'>('PERIODO');
  const [consumoKwh, setConsumoKwh] = useState(397);
  const [potenzaKw, setPotenzaKw] = useState(3);
  const [giorniFattura, setGiorniFattura] = useState(60);
  const [nomeCliente, setNomeCliente] = useState('');
  const [pod, setPod] = useState('');
  const [codiceFiscalePiva, setCodiceFiscalePiva] = useState('');

  const [prezzoKwh, setPrezzoKwh] = useState<number | ''>('');
  const [ccv, setCcv] = useState<number | ''>('');
  const [tipoPrezzoConcorrente, setTipoPrezzoConcorrente] = useState<'FISSO' | 'VARIABILE'>('FISSO');
  const [totaleDichiarato, setTotaleDichiarato] = useState<number | ''>('');
  const [nomeFornitore, setNomeFornitore] = useState('');

  // Segnalazione dell'offerta concorrente (per la pagina pubblica "/mercato"):
  // gli operatori, avendo già in mano i dati veri della bolletta del cliente,
  // sono la fonte più affidabile che abbiamo — meglio di una ricerca web.
  const [sconto, setSconto] = useState('');
  const [durataDal, setDurataDal] = useState('');
  const [durataAl, setDurataAl] = useState('');
  const [canaleSegnalazione, setCanaleSegnalazione] = useState<'WEB' | 'ALTRO'>('ALTRO');
  const [nomeSegnalatore, setNomeSegnalatore] = useState('');
  const [segnalazioneStato, setSegnalazioneStato] = useState<'idle' | 'invio' | 'ok' | 'errore'>('idle');

  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [fasceRete, setFasceRete] = useState<FasciaRete[]>([]);
  const [argomenti, setArgomenti] = useState<ArgomentoVendita[]>([]);
  const [ocrStato, setOcrStato] = useState<'idle' | 'analisi' | 'ok' | 'errore'>('idle');
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [analisiIA, setAnalisiIA] = useState<string | null>(null);
  const [costiExtra, setCostiExtra] = useState<{ descrizione: string; importo: number | null; tipo: string }[]>([]);

  // Il caricamento foto/PDF (analisi AI, a pagamento) è riservato agli
  // operatori abilitati con una password condivisa; l'inserimento manuale
  // dei dati resta sempre disponibile a chiunque, nessuna limitazione lì.
  const [operatorKey, setOperatorKey] = useState('');
  const [mostraSblocco, setMostraSblocco] = useState(false);
  const [pwOperatore, setPwOperatore] = useState('');

  useEffect(() => {
    const salvata = typeof window !== 'undefined' ? sessionStorage.getItem('operatorKey') : null;
    if (salvata) setOperatorKey(salvata);
  }, []);

  function sbloccaOperatore() {
    if (!pwOperatore) return;
    sessionStorage.setItem('operatorKey', pwOperatore);
    setOperatorKey(pwOperatore);
    setMostraSblocco(false);
    setPwOperatore('');
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/offerte').then((r) => r.json()),
      fetch('/api/parametri').then((r) => r.json()),
      fetch('/api/argomenti').then((r) => r.json()),
      fetch('/api/fasce-rete').then((r) => r.json())
    ]).then(([o, p, a, f]) => {
      setOfferte(o);
      setParametri(p);
      setArgomenti(a);
      setFasceRete(f);
    });
  }, []);

  const input = { commodity, consumoKwh, tipoConsumo, potenzaKw, giorniFattura, percentualeConsumoScontato: 20 };

  const migliorEnel = useMemo(() => {
    const risultati = calcolaTutteLeOfferte(offerte, input, parametri, fasceRete);
    return risultati[0] ?? null;
  }, [offerte, parametri, fasceRete, commodity, consumoKwh, tipoConsumo, potenzaKw, giorniFattura]);

  const risultatoConcorrente = useMemo(() => {
    if (prezzoKwh === '' || ccv === '' || parametri.length === 0) return null;
    return calcolaConcorrente(Number(prezzoKwh), Number(ccv), input, parametri, fasceRete);
  }, [prezzoKwh, ccv, parametri, fasceRete, commodity, consumoKwh, tipoConsumo, potenzaKw, giorniFattura]);

  const deltaPeriodo = useMemo(() => {
    if (!migliorEnel || !risultatoConcorrente) return null;
    return risultatoConcorrente.totaleBolletta - migliorEnel.totaleBolletta;
  }, [migliorEnel, risultatoConcorrente]);

  const risparmioAnnuo = useMemo(() => {
    if (deltaPeriodo === null) return null;
    return deltaPeriodo * (365 / giorniFattura);
  }, [deltaPeriodo, giorniFattura]);

  const LIMITE_FILE_MB = 4;

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > LIMITE_FILE_MB * 1024 * 1024) {
      setOcrStato('errore');
      setOcrNote(
        `File troppo grande (${(file.size / 1024 / 1024).toFixed(1)} MB, limite ${LIMITE_FILE_MB} MB). Se è un PDF con più pagine, prova a esportare/fotografare solo la pagina con i dati economici, oppure comprimi il PDF prima di caricarlo.`
      );
      return;
    }

    setOcrStato('analisi');
    setOcrNote(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-operator-key': operatorKey },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type })
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          setOcrStato('errore');
          setOcrNote(`Il server ha risposto in modo inatteso (status ${res.status}). Riprova, o usa un file più piccolo.`);
          return;
        }

        if (res.status === 401) {
          sessionStorage.removeItem('operatorKey');
          setOperatorKey('');
          setOcrStato('errore');
          setOcrNote(data.error ?? 'Password operatore errata o mancante.');
          return;
        }
        if (!res.ok) {
          setOcrStato('errore');
          setOcrNote(data.error ?? `Estrazione non riuscita (status ${res.status}).`);
          return;
        }
        const prezzo = commodity === 'LUCE' ? data.prezzoKwhLuce : data.prezzoKwhGas;
        if (prezzo) setPrezzoKwh(prezzo);
        if (data.ccvMensile) setCcv(data.ccvMensile);
        if (data.totaleBolletta) setTotaleDichiarato(data.totaleBolletta);
        if (data.fornitore) setNomeFornitore(data.fornitore);
        setAnalisiIA(data.analisi ?? null);
        setCostiExtra(Array.isArray(data.costiExtra) ? data.costiExtra : []);
        setOcrStato('ok');
        if (data.confidenza !== 'alta' || data.note) {
          setOcrNote(
            `Confidenza ${data.confidenza ?? 'da verificare'}${data.note ? ' — ' + data.note : ''}. Controlla i valori prima di confermare.`
          );
        }
      } catch (err) {
        setOcrStato('errore');
        setOcrNote(`Errore di rete durante l'invio del documento${err instanceof Error ? ': ' + err.message : ''}.`);
      }
    };
    reader.readAsDataURL(file);

  }

  async function scaricaPdfEnel() {
    if (!migliorEnel) return;
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risultato: migliorEnel, input, nomeCliente, pod, codiceFiscalePiva })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolletta-simulata-${migliorEnel.offerta.nome}.pdf`;
    a.click();
  }

  async function segnalaOfferta() {
    if (!nomeFornitore || prezzoKwh === '') return;
    setSegnalazioneStato('invio');
    const noteParti = [
      `Segnalata dal campo${nomeSegnalatore ? ' da ' + nomeSegnalatore : ''} il ${new Date().toLocaleDateString('it-IT')}, DA VERIFICARE.`,
      sconto ? `Sconto/promo: ${sconto}.` : null,
      durataDal || durataAl ? `Offerta valida dal ${durataDal || '?'} al ${durataAl || '?'}.` : null
    ].filter(Boolean);
    try {
      const res = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornitore: nomeFornitore,
          nomeOfferta: `Offerta ${nomeFornitore}`,
          commodity,
          tipoPrezzo: tipoPrezzoConcorrente,
          prezzoKwh: Number(prezzoKwh),
          ccvMensile: ccv === '' ? null : Number(ccv),
          canale: canaleSegnalazione,
          note: noteParti.join(' '),
          attiva: false,
          ordinamento: 99
        })
      });
      setSegnalazioneStato(res.ok ? 'ok' : 'errore');
    } catch {
      setSegnalazioneStato('errore');
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Confronto con la concorrenza</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Inserisci solo prezzo kWh e CCV del concorrente (a mano o da foto bolletta): gli altri dati restano quelli
        del cliente inseriti qui sotto.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="fascia-navy">Dati cliente</div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Commodity</label>
                <select className="input" value={commodity} onChange={(e) => setCommodity(e.target.value as Commodity)}>
                  <option value="LUCE">Luce</option>
                  <option value="GAS">Gas</option>
                </select>
              </div>
              <div>
                <label className="label">Giorni fattura</label>
                <input type="number" className="input" value={giorniFattura} onChange={(e) => setGiorniFattura(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Tipo consumo</label>
                <select
                  className="input"
                  value={tipoConsumo}
                  onChange={(e) => setTipoConsumo(e.target.value as 'ANNUO' | 'PERIODO')}
                >
                  <option value="PERIODO">Del periodo</option>
                  <option value="ANNUO">Annuo</option>
                </select>
              </div>
              <div>
                <label className="label">{tipoConsumo === 'PERIODO' ? `${commodity === 'GAS' ? 'Smc' : 'kWh'} nei ${giorniFattura} giorni` : `${commodity === 'GAS' ? 'Smc' : 'kWh'} in un anno`}</label>
                <input
                  type="number"
                  className="input"
                  value={consumoKwh}
                  onChange={(e) => setConsumoKwh(Number(e.target.value))}
                />
              </div>
              {commodity === 'LUCE' && (
                <div>
                  <label className="label">Potenza kW</label>
                  <input type="number" className="input" value={potenzaKw} onChange={(e) => setPotenzaKw(Number(e.target.value))} />
                </div>
              )}
              <div>
                <label className="label">Nome cliente (per PDF)</label>
                <input className="input" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
              </div>
              <div>
                <label className="label">POD (opzionale, per PDF)</label>
                <input className="input" value={pod} onChange={(e) => setPod(e.target.value)} placeholder="IT001E..." />
              </div>
              <div>
                <label className="label">Cod. Fiscale/P.IVA (opzionale)</label>
                <input className="input" value={codiceFiscalePiva} onChange={(e) => setCodiceFiscalePiva(e.target.value)} />
              </div>
            </div>

            <div className="font-medium text-sm mb-3 pt-3 border-t border-enel-line">Bolletta concorrente</div>

            <label className="label">Foto o PDF bolletta (opzionale, precompila i campi e analizza eventuali costi extra)</label>
            {operatorKey ? (
              <>
                <input type="file" accept="image/*,.pdf" className="input mb-2" onChange={handleFoto} />
                <button
                  className="text-[11px] text-enel-ink/30 hover:underline mb-2"
                  onClick={() => {
                    sessionStorage.removeItem('operatorKey');
                    setOperatorKey('');
                  }}
                >
                  Blocca di nuovo il caricamento file
                </button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-enel-line p-3 mb-2">
                <div className="text-xs text-enel-ink/50 mb-2">
                  Il caricamento foto/PDF con analisi AI è riservato agli operatori abilitati. Puoi comunque
                  compilare i campi qui sotto a mano, senza limitazioni.
                </div>
                {mostraSblocco ? (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Password operatore"
                      className="input text-xs"
                      value={pwOperatore}
                      onChange={(e) => setPwOperatore(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sbloccaOperatore()}
                      autoFocus
                    />
                    <button className="btn-secondary text-xs whitespace-nowrap" onClick={sbloccaOperatore}>
                      Sblocca
                    </button>
                  </div>
                ) : (
                  <button className="text-xs text-enel-navy hover:underline" onClick={() => setMostraSblocco(true)}>
                    🔒 Sei un operatore abilitato? Sblocca il caricamento
                  </button>
                )}
              </div>
            )}
            {ocrStato === 'analisi' && <div className="text-xs text-enel-ink/50 mb-2">Analisi del documento in corso…</div>}
            {ocrStato === 'ok' && ocrNote && <div className="text-xs text-enel-amber mb-2">{ocrNote}</div>}
            {ocrStato === 'errore' && <div className="text-xs text-red-600 mb-2">{ocrNote}</div>}

            {ocrStato === 'ok' && (analisiIA || costiExtra.length > 0) && (
              <div className="rounded-lg border border-enel-line bg-enel-paper p-3 mb-3">
                <div className="text-xs font-semibold text-enel-navy mb-1">🔎 Analisi automatica</div>
                {analisiIA && <p className="text-xs text-enel-ink/70 leading-relaxed mb-2">{analisiIA}</p>}
                {costiExtra.length > 0 && (
                  <div className="space-y-1">
                    {costiExtra.map((c, i) => (
                      <div key={i} className="flex justify-between items-baseline text-xs">
                        <span className="text-enel-ink/60">
                          {c.tipo === 'una_tantum' ? '🕐 Una tantum' : '➕ Ricorrente extra'} — {c.descrizione}
                        </span>
                        {c.importo != null && <span className="font-medium">{c.importo.toFixed(2)} €</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Fornitore</label>
                <input className="input" value={nomeFornitore} onChange={(e) => setNomeFornitore(e.target.value)} />
              </div>
              <div>
                <label className="label">Tipo prezzo</label>
                <select
                  className="input"
                  value={tipoPrezzoConcorrente}
                  onChange={(e) => setTipoPrezzoConcorrente(e.target.value as 'FISSO' | 'VARIABILE')}
                >
                  <option value="FISSO">Fisso</option>
                  <option value="VARIABILE">Variabile</option>
                </select>
              </div>
              <div>
                <label className="label">Prezzo {commodity === 'GAS' ? 'Smc' : 'kWh'} (€)</label>
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
              <div className="col-span-2">
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

            <div className="font-medium text-sm mb-3 pt-3 mt-4 border-t border-enel-line">
              Segnala questa offerta al mercato
              <span className="block text-xs font-normal text-enel-ink/50 mt-0.5">
                Facoltativo: invia questi dati alla pagina pubblica "Mercato dell'energia", dopo verifica di un
                amministratore. Aiuta tutta la rete a tenere aggiornato il quadro della concorrenza.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="col-span-2">
                <label className="label">Sconto/promozione (opzionale)</label>
                <input
                  className="input"
                  placeholder="es. -10% primi 12 mesi, bonus welcome…"
                  value={sconto}
                  onChange={(e) => setSconto(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Offerta valida dal</label>
                <input type="date" className="input" value={durataDal} onChange={(e) => setDurataDal(e.target.value)} />
              </div>
              <div>
                <label className="label">al</label>
                <input type="date" className="input" value={durataAl} onChange={(e) => setDurataAl(e.target.value)} />
              </div>
              <div>
                <label className="label">Canale</label>
                <select className="input" value={canaleSegnalazione} onChange={(e) => setCanaleSegnalazione(e.target.value as 'WEB' | 'ALTRO')}>
                  <option value="ALTRO">Vista di persona / bolletta reale</option>
                  <option value="WEB">Offerta solo web</option>
                </select>
              </div>
              <div>
                <label className="label">Il tuo nome (opzionale)</label>
                <input className="input" value={nomeSegnalatore} onChange={(e) => setNomeSegnalatore(e.target.value)} />
              </div>
            </div>
            <button
              className="btn-secondary text-sm w-full"
              onClick={segnalaOfferta}
              disabled={!nomeFornitore || prezzoKwh === '' || segnalazioneStato === 'invio'}
            >
              {segnalazioneStato === 'invio' ? 'Invio…' : '📩 Segnala questa offerta'}
            </button>
            {segnalazioneStato === 'ok' && (
              <div className="text-xs text-enel-green mt-2">
                Grazie! Segnalazione inviata: comparirà su "Mercato dell'energia" dopo la verifica.
              </div>
            )}
            {segnalazioneStato === 'errore' && (
              <div className="text-xs text-red-600 mt-2">Invio non riuscito, riprova.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="fascia-navy flex items-center justify-between">
              <span>Confronto</span>
              {migliorEnel && (
                <button
                  className="bg-white text-enel-navy rounded px-3 py-1 text-xs font-semibold normal-case tracking-normal"
                  onClick={scaricaPdfEnel}
                >
                  Scarica PDF Enel
                </button>
              )}
            </div>
            <div className="p-5">
              {!migliorEnel || !risultatoConcorrente ? (
                <div className="text-sm text-enel-ink/50">Inserisci prezzo kWh e CCV del concorrente per vedere il confronto.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="box-navy p-4">
                      <div className="text-xs text-white/70 mb-1">Enel — {migliorEnel.offerta.nome}</div>
                      <div className="text-xl font-semibold">{euro(migliorEnel.totaleBolletta)}</div>
                    </div>
                    <div className="rounded-lg border border-enel-line p-4">
                      <div className="text-xs text-enel-ink/60 mb-1">{nomeFornitore || 'Concorrente'}</div>
                      <div className="text-xl font-semibold">{euro(risultatoConcorrente.totaleBolletta)}</div>
                    </div>
                  </div>

                  {deltaPeriodo !== null && (
                    <div className="flex justify-between items-center text-sm mb-2 px-1">
                      <span className="text-enel-ink/60">Delta sul periodo ({giorniFattura} giorni)</span>
                      <span className={`font-semibold ${deltaPeriodo > 0 ? 'text-enel-greenDark' : 'text-enel-amber'}`}>
                        {deltaPeriodo > 0 ? '−' : '+'}
                        {euro(Math.abs(deltaPeriodo))}
                      </span>
                    </div>
                  )}

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
                        : `L'offerta concorrente costerebbe circa ${euro(-risparmioAnnuo)} in meno l'anno.`}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {migliorEnel && risultatoConcorrente && (
            <Argomentario
              argomenti={argomenti}
              enelVince={migliorEnel.totaleBolletta <= risultatoConcorrente.totaleBolletta}
              tipoPrezzoConcorrente={tipoPrezzoConcorrente}
            />
          )}
        </div>
      </div>
    </div>
  );
}
