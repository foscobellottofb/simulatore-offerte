'use client';

import { useEffect, useMemo, useState } from 'react';
import { Offerta, ParametroDettaglio, FasciaRete, Commodity, ArgomentoVendita } from '@/lib/types';
import { calcolaTutteLeOfferte, calcolaConcorrente } from '@/lib/calcoli';
import { Argomentario } from '@/components/Argomentario';
import { AiutoCampo } from '@/components/AiutoCampo';

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function ConcorrenzaClient() {
  const [commodity, setCommodity] = useState<Commodity>('LUCE');
  const [tipoConsumo, setTipoConsumo] = useState<'ANNUO' | 'PERIODO'>('PERIODO');
  const [consumoKwh, setConsumoKwh] = useState<number | ''>(397);
  const [potenzaKw, setPotenzaKw] = useState<number | ''>(3);
  const [giorniFattura, setGiorniFattura] = useState<number | ''>(60);
  const [nomeCliente, setNomeCliente] = useState('');
  const [pod, setPod] = useState('');
  const [codiceFiscalePiva, setCodiceFiscalePiva] = useState('');
  const [indirizzoFornitura, setIndirizzoFornitura] = useState('');
  const [citta, setCitta] = useState('');
  const [nomeConsulente, setNomeConsulente] = useState('');
  const [scriptVendita, setScriptVendita] = useState<string | null>(null);
  const [scriptStato, setScriptStato] = useState<'idle' | 'genera' | 'errore'>('idle');

  const [prezzoKwh, setPrezzoKwh] = useState<number | ''>('');
  const [ccv, setCcv] = useState<number | ''>('');
  const [tipoPrezzoConcorrente, setTipoPrezzoConcorrente] = useState<'FISSO' | 'VARIABILE'>('FISSO');
  const [totaleDichiarato, setTotaleDichiarato] = useState<number | ''>('');
  const [nomeFornitore, setNomeFornitore] = useState('');

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

  const input = {
    commodity,
    consumoKwh: consumoKwh === '' ? 0 : consumoKwh,
    tipoConsumo,
    potenzaKw: potenzaKw === '' ? 0 : potenzaKw,
    giorniFattura: giorniFattura === '' ? 0 : giorniFattura,
    percentualeConsumoF2: 20,
    percentualeConsumoF3: 0
  };

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
    if (deltaPeriodo === null || !giorniFattura) return null;
    return deltaPeriodo * (365 / giorniFattura);
  }, [deltaPeriodo, giorniFattura]);

  const LIMITE_FILE_MB = 4;
  const LIMITE_FILE_TOTALE_MB = 8;

  function leggiFileBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('Lettura file non riuscita'));
      reader.readAsDataURL(file);
    });
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const contienePdf = files.some((f) => f.type === 'application/pdf');
    if (contienePdf && files.length > 1) {
      setOcrStato('errore');
      setOcrNote('Un PDF è già multipagina: carica un solo PDF, oppure più foto (una per pagina) invece del PDF.');
      return;
    }

    const dimensioneTotale = files.reduce((s, f) => s + f.size, 0);
    const fileTroppoGrande = files.find((f) => f.size > LIMITE_FILE_MB * 1024 * 1024);
    if (fileTroppoGrande) {
      setOcrStato('errore');
      setOcrNote(
        `"${fileTroppoGrande.name}" è troppo grande (${(fileTroppoGrande.size / 1024 / 1024).toFixed(1)} MB, limite ${LIMITE_FILE_MB} MB per file).`
      );
      return;
    }
    if (dimensioneTotale > LIMITE_FILE_TOTALE_MB * 1024 * 1024) {
      setOcrStato('errore');
      setOcrNote(
        `Le foto insieme superano ${LIMITE_FILE_TOTALE_MB} MB (limite totale). Riduci il numero di foto o comprimile.`
      );
      return;
    }

    setOcrStato('analisi');
    setOcrNote(null);

    try {
      const pagine = await Promise.all(
        files.map(async (file) => ({ data: await leggiFileBase64(file), mediaType: file.type }))
      );

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-operator-key': operatorKey },
        body: JSON.stringify({ pagine })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setOcrStato('errore');
        setOcrNote(`Il server ha risposto in modo inatteso (status ${res.status}). Riprova, o usa file più piccoli.`);
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
      if (data.consumoKwh) setConsumoKwh(data.consumoKwh);
      if (data.potenzaKw) setPotenzaKw(data.potenzaKw);
      if (data.giorniFattura) {
        setGiorniFattura(data.giorniFattura);
        setTipoConsumo('PERIODO');
      }
      if (data.nomeCliente) setNomeCliente(data.nomeCliente);
      if (data.pod) setPod(data.pod);
      if (data.indirizzoFornitura) setIndirizzoFornitura(data.indirizzoFornitura);
      if (data.citta) setCitta(data.citta);
      if (data.codiceFiscalePiva) setCodiceFiscalePiva(data.codiceFiscalePiva);
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
  }

  async function scaricaPdfEnel() {
    if (!migliorEnel) return;
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risultato: migliorEnel, input, nomeCliente, pod, indirizzoFornitura, citta, codiceFiscalePiva })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolletta-simulata-${migliorEnel.offerta.nome}.pdf`;
    a.click();
  }

  async function generaScriptVendita() {
    if (!migliorEnel || !risultatoConcorrente) return;
    setScriptStato('genera');
    setScriptVendita(null);
    try {
      const res = await fetch('/api/script-vendita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente,
          commodity,
          offertaNome: migliorEnel.offerta.nome,
          fornitoreConcorrente: nomeFornitore,
          totaleEnel: migliorEnel.totaleBolletta,
          totaleConcorrente: risultatoConcorrente.totaleBolletta,
          risparmioAnnuo,
          nomeConsulente
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setScriptStato('errore');
        setScriptVendita(data.error ?? 'Generazione non riuscita, riprova.');
        return;
      }
      setScriptVendita(data.script);
      setScriptStato('idle');
    } catch {
      setScriptStato('errore');
      setScriptVendita('Errore di rete, riprova.');
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
                <label className="label">
                  Giorni fattura
                  <AiutoCampo testo="Il periodo simulato. Le quote fisse (CCV, quota fissa/potenza di rete) sono annualizzate e poi scalate su questo numero di giorni, sia per l'offerta Enel che per il concorrente." />
                </label>
                <input
                  type="number"
                  className="input"
                  value={giorniFattura}
                  onChange={(e) => setGiorniFattura(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label">
                  Tipo consumo
                  <AiutoCampo testo='"Del periodo" = hai già i kWh del periodo fatturato. "Annuo" = hai una stima del consumo annuo, scalata automaticamente sui giorni fattura.' />
                </label>
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
                  onChange={(e) => setConsumoKwh(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              {commodity === 'LUCE' && (
                <div>
                  <label className="label">
                    Potenza kW
                    <AiutoCampo testo="La potenza impegnata del cliente. Determina la fascia ARERA (BTA1-BTA6) usata per calcolare i costi di rete." />
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={potenzaKw}
                    onChange={(e) => setPotenzaKw(e.target.value === '' ? '' : Number(e.target.value))}
                  />
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
              <div>
                <label className="label">Indirizzo fornitura (opzionale, per PDF)</label>
                <input className="input" value={indirizzoFornitura} onChange={(e) => setIndirizzoFornitura(e.target.value)} placeholder="Via Roma 12" />
              </div>
              <div>
                <label className="label">Città (opzionale, per PDF)</label>
                <input className="input" value={citta} onChange={(e) => setCitta(e.target.value)} placeholder="33072 Casarsa della Delizia PN" />
              </div>
            </div>

            <div className="font-medium text-sm mb-3 pt-3 border-t border-enel-line">Bolletta concorrente</div>

            <label className="label">
              Foto o PDF bolletta (opzionale, precompila i campi e analizza eventuali costi extra)
              <AiutoCampo testo="Bolletta cartacea di più pagine? Seleziona tutte le foto insieme (tieni premuto Ctrl/Cmd nel selettore file, o scattale e scegli 'seleziona tutte'): vengono lette come un unico documento. Un PDF invece va caricato da solo, è già multipagina." />
            </label>
            {operatorKey ? (
              <>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="input mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={handleFoto}
                  disabled={ocrStato === 'analisi'}
                />
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
            {ocrStato === 'analisi' && (
              <div className="flex items-center gap-2 rounded-lg border border-enel-navy/30 bg-enel-navy/5 px-3 py-2 mb-2">
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full border-2 border-enel-navy/30 border-t-enel-navy animate-spin"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-enel-navy">
                  Sto leggendo il documento, attendere… (può richiedere alcuni secondi, soprattutto con più pagine)
                </span>
              </div>
            )}
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
                <label className="label">
                  Totale dichiarato (per verifica)
                  <AiutoCampo testo="Se il cliente ti ha detto il totale della sua bolletta, inseriscilo qui: il sistema calcola lo scarto rispetto al totale ricostruito da prezzo/CCV, utile per verificare la coerenza dei dati raccolti." />
                </label>
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

          {migliorEnel && risultatoConcorrente && (
            <div className="card p-4">
              <div className="text-sm font-semibold mb-1" style={{ color: '#006FBB' }}>✍️ Caracozzo AI consiglia</div>
              <p className="text-xs text-enel-ink/50 mb-3">
                Genera un discorso pronto da leggere al cliente: mette in evidenza il risparmio, il fatto che da
                oggi ha un consulente dedicato che segue le sue forniture nel tempo, e la solidità del marchio
                Enel. Consuma credito Anthropic (chiamata breve, pochi centesimi).
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  className="input text-sm flex-1"
                  placeholder="Il tuo nome (per firmare lo script, opzionale)"
                  value={nomeConsulente}
                  onChange={(e) => setNomeConsulente(e.target.value)}
                />
                <button className="btn-secondary text-sm whitespace-nowrap" onClick={generaScriptVendita} disabled={scriptStato === 'genera'}>
                  {scriptStato === 'genera' ? 'Genero…' : 'Genera script'}
                </button>
              </div>
              {scriptVendita && (
                <div
                  className={`rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    scriptStato === 'errore' ? 'bg-red-50 text-red-700' : 'bg-enel-paper text-enel-ink/80'
                  }`}
                >
                  {scriptVendita}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
