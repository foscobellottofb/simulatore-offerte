'use client';

import { useEffect, useMemo, useState } from 'react';
import { Offerta, ParametroDettaglio, FasciaRete, RisultatoCalcolo, Commodity } from '@/lib/types';
import { calcolaTutteLeOfferte } from '@/lib/calcoli';
import { ZONE_GAS, ZONA_GAS_DEFAULT } from '@/lib/zoneGas';
import { AiutoCampo } from '@/components/AiutoCampo';
import { leggiPersistito, scriviPersistito } from '@/lib/persistiCampi';

function euro(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// Campi condivisi con "Confronto concorrenza": modificati in una pagina,
// restano compilati anche passando all'altra, senza dover ricaricare la
// foto o ridigitare tutto.
interface DatiClienteSalvati {
  commodity: Commodity;
  tipoConsumo: 'ANNUO' | 'PERIODO';
  consumoKwh: number | '';
  potenzaKw: number | '';
  giorniFattura: number | '';
  zonaGas: string;
  nomeCliente: string;
  pod: string;
  indirizzoFornitura: string;
  citta: string;
  codiceFiscalePiva: string;
}

export function SimulatoreClient() {
  const salvati = leggiPersistito<DatiClienteSalvati>('simulotto:cliente');

  const [commodity, setCommodity] = useState<Commodity>(salvati.commodity ?? 'LUCE');
  const [tipoConsumo, setTipoConsumo] = useState<'ANNUO' | 'PERIODO'>(salvati.tipoConsumo ?? 'PERIODO');
  const [consumoKwh, setConsumoKwh] = useState<number | ''>(salvati.consumoKwh ?? 397);
  const [potenzaKw, setPotenzaKw] = useState<number | ''>(salvati.potenzaKw ?? 3);
  const [giorniFattura, setGiorniFattura] = useState<number | ''>(salvati.giorniFattura ?? 60);
  const [zonaGas, setZonaGas] = useState<string>(salvati.zonaGas ?? ZONA_GAS_DEFAULT);
  const [percentualeConsumoF2, setPercentualeConsumoF2] = useState(20);
  const [percentualeConsumoF3, setPercentualeConsumoF3] = useState(0);

  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [parametri, setParametri] = useState<ParametroDettaglio[]>([]);
  const [fasceRete, setFasceRete] = useState<FasciaRete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selezionata, setSelezionata] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState(salvati.nomeCliente ?? '');
  const [pod, setPod] = useState(salvati.pod ?? '');
  const [indirizzoFornitura, setIndirizzoFornitura] = useState(salvati.indirizzoFornitura ?? '');
  const [citta, setCitta] = useState(salvati.citta ?? '');
  const [codiceFiscalePiva, setCodiceFiscalePiva] = useState(salvati.codiceFiscalePiva ?? '');

  // Salva ad ogni modifica, così "Confronto concorrenza" li ritrova.
  useEffect(() => {
    scriviPersistito('simulotto:cliente', {
      commodity,
      tipoConsumo,
      consumoKwh,
      potenzaKw,
      giorniFattura,
      zonaGas,
      nomeCliente,
      pod,
      indirizzoFornitura,
      citta,
      codiceFiscalePiva
    });
  }, [commodity, tipoConsumo, consumoKwh, potenzaKw, giorniFattura, zonaGas, nomeCliente, pod, indirizzoFornitura, citta, codiceFiscalePiva]);

  useEffect(() => {
    Promise.all([
      fetch('/api/offerte').then((r) => r.json()),
      fetch('/api/parametri').then((r) => r.json()),
      fetch('/api/fasce-rete').then((r) => r.json())
    ]).then(([o, p, f]) => {
      setOfferte(o);
      setParametri(p);
      setFasceRete(f);
      setLoading(false);
    });
  }, []);

  const input = {
    commodity,
    consumoKwh: consumoKwh === '' ? 0 : consumoKwh,
    tipoConsumo,
    potenzaKw: potenzaKw === '' ? 0 : potenzaKw,
    giorniFattura: giorniFattura === '' ? 0 : giorniFattura,
    zonaGas,
    percentualeConsumoF2,
    percentualeConsumoF3
  };

  const risultati: RisultatoCalcolo[] = useMemo(() => {
    if (loading) return [];
    return calcolaTutteLeOfferte(offerte, input, parametri, fasceRete);
  }, [offerte, parametri, fasceRete, commodity, consumoKwh, tipoConsumo, potenzaKw, giorniFattura, zonaGas, percentualeConsumoF2, percentualeConsumoF3, loading]);

  // I campi "quota consumo in F2/F3" hanno senso solo se almeno un'offerta
  // disponibile (es. "Ore Happy") ha davvero più fasce di prezzo.
  const haOfferteConF2 = offerte.some((o) => o.commodity === commodity && o.prezzoF2 != null);
  const haOfferteConF3 = offerte.some((o) => o.commodity === commodity && o.prezzoF3 != null);


  const migliore = risultati[0];
  const attiva = risultati.find((r) => r.offerta.id === selezionata) ?? migliore;

  async function scaricaPdf() {
    if (!attiva) return;
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        risultato: attiva,
        input,
        nomeCliente,
        pod,
        indirizzoFornitura,
        citta,
        codiceFiscalePiva
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
            <label className="label">
              Tipo consumo
              <AiutoCampo testo='"Del periodo" = hai già i kWh del periodo fatturato (es. da una bolletta reale). "Annuo" = hai una stima del consumo annuo, e viene scalato automaticamente sui giorni fattura.' />
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
                <AiutoCampo testo="La potenza impegnata del cliente. Determina la fascia ARERA (BTA1-BTA6) per i costi di rete e filtra quali offerte sono disponibili." />
              </label>
              <input
                type="number"
                className="input"
                value={potenzaKw}
                onChange={(e) => setPotenzaKw(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          )}
          {commodity === 'GAS' && (
            <div>
              <label className="label">
                Zona tariffaria gas
                <AiutoCampo testo="Le tariffe di trasporto/distribuzione gas ARERA variano per zona geografica. Solo 'Nord Orientale' ha valori verificati; le altre vanno compilate da Admin prima di usarle per un confronto affidabile." />
              </label>
              <select className="input" value={zonaGas} onChange={(e) => setZonaGas(e.target.value)}>
                {ZONE_GAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                    {z !== ZONA_GAS_DEFAULT ? ' (da verificare)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">
              Giorni fattura
              <AiutoCampo testo="Il periodo simulato (es. 60 giorni per una bimestrale). Le quote fisse (CCV, quota fissa/potenza di rete) sono annualizzate e poi scalate su questo numero di giorni." />
            </label>
            <input
              type="number"
              className="input"
              value={giorniFattura}
              onChange={(e) => setGiorniFattura(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          {haOfferteConF2 && (
            <div>
              <label className="label">Quota consumo stimata in F2 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={percentualeConsumoF2}
                onChange={(e) => setPercentualeConsumoF2(Number(e.target.value))}
              />
              <div className="text-[11px] text-enel-ink/40 mt-1">
                Per offerte a più fasce (es. "Ore Happy"): quanto del consumo del cliente stimi che ricada in F2 —
                chiedilo al cliente o stimalo. Il resto va in F1.
              </div>
            </div>
          )}
          {haOfferteConF3 && (
            <div>
              <label className="label">Quota consumo stimata in F3 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={percentualeConsumoF3}
                onChange={(e) => setPercentualeConsumoF3(Number(e.target.value))}
              />
            </div>
          )}
          <div>
            <label className="label">Nome cliente (opzionale)</label>
            <input className="input" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
          <div>
            <label className="label">POD (opzionale, per il PDF)</label>
            <input className="input" value={pod} onChange={(e) => setPod(e.target.value)} placeholder="IT001E..." />
          </div>
          <div>
            <label className="label">Indirizzo fornitura (opzionale, per il PDF)</label>
            <input className="input" value={indirizzoFornitura} onChange={(e) => setIndirizzoFornitura(e.target.value)} placeholder="Via Roma 12" />
          </div>
          <div>
            <label className="label">Città (opzionale, per il PDF)</label>
            <input className="input" value={citta} onChange={(e) => setCitta(e.target.value)} placeholder="33072 Casarsa della Delizia PN" />
          </div>
          <div>
            <label className="label">Cod. Fiscale/P.IVA (opzionale)</label>
            <input className="input" value={codiceFiscalePiva} onChange={(e) => setCodiceFiscalePiva(e.target.value)} />
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
            <div className="fascia-navy">Elenco offerte</div>
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
                      {r.offerta.tipoPrezzo === 'VARIABILE_CAP' ? (
                        `CAP ${r.offerta.cap?.toFixed(4)} €/${r.offerta.commodity === 'GAS' ? 'Smc' : 'kWh'}`
                      ) : r.offerta.prezzoF2 != null ? (
                        <div>
                          <div>
                            F1 {r.offerta.prezzoFisso?.toFixed(4)} €/{r.offerta.commodity === 'GAS' ? 'Smc' : 'kWh'}
                          </div>
                          <div className="text-xs text-enel-ink/50">
                            F2 {r.offerta.prezzoF2.toFixed(4)}
                            {r.offerta.oreInizioF2 != null && ` (${r.offerta.oreInizioF2}-${r.offerta.oreFineF2})`}
                            {r.offerta.prezzoF3 != null && ` · F3 ${r.offerta.prezzoF3.toFixed(4)}`}
                          </div>
                        </div>
                      ) : (
                        `${r.offerta.prezzoFisso?.toFixed(4)} €/${r.offerta.commodity === 'GAS' ? 'Smc' : 'kWh'}`
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">{euro(r.offerta.ccvMensile)}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {euro(r.totaleBolletta)}
                      {r.offerta.id === migliore.offerta.id ? (
                        <span className="ml-2 text-xs text-enel-green font-medium">migliore</span>
                      ) : (
                        <span className="ml-2 text-xs text-enel-ink/40 font-medium">
                          +{euro(r.totaleBolletta - migliore.totaleBolletta)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        className="btn-secondary text-xs py-1"
                        onClick={() => {
                          setSelezionata(r.offerta.id);
                          localStorage.setItem('offertaSelezionataId', r.offerta.id);
                        }}
                      >
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
            <div className="card overflow-hidden">
              <div className="fascia-navy flex items-center justify-between">
                <span>Scontrino dell'energia — {attiva.offerta.nome}</span>
                <button className="bg-white text-enel-navy rounded px-3 py-1 text-xs font-semibold normal-case tracking-normal" onClick={scaricaPdf}>
                  Scarica PDF
                </button>
              </div>
              <div className="p-5">
                <div className="space-y-1 text-sm mb-4">
                  <RigaRiepilogo
                    label="Quota consumi"
                    valore={attiva.riepilogo.quotaConsumi}
                    righe={attiva.righeDettaglio.filter((r) => r.gruppo === 'CONSUMI')}
                  />
                  <RigaRiepilogo
                    label="Quota fissa e potenza"
                    valore={attiva.riepilogo.quotaFissaEPotenza}
                    righe={attiva.righeDettaglio.filter((r) => r.gruppo === 'FISSA_POTENZA')}
                  />
                  {attiva.riepilogo.altrePartite > 0 && (
                    <RigaRiepilogo
                      label="Altre partite"
                      valore={attiva.riepilogo.altrePartite}
                      righe={attiva.righeDettaglio.filter((r) => r.gruppo === 'ALTRE')}
                    />
                  )}
                  <RigaRiepilogo
                    label="Accise e IVA"
                    valore={attiva.riepilogo.acciseEIva}
                    righe={[...attiva.righeDettaglio.filter((r) => r.gruppo === 'ACCISE'), { categoria: '', etichetta: 'IVA', valore: attiva.iva, gruppo: 'ACCISE' as const }]}
                  />
                </div>
                <div className="box-navy flex justify-between items-center px-4 py-3 text-base font-semibold">
                  <span>Totale bolletta</span>
                  <span className="text-xl">{euro(attiva.totaleBolletta)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RigaRiepilogo({
  label,
  valore,
  righe
}: {
  label: string;
  valore: number;
  righe: { etichetta: string; valore: number }[];
}) {
  const [aperto, setAperto] = useState(false);
  return (
    <div className="border-b border-enel-line/60 last:border-b-0">
      <button className="w-full flex justify-between items-center py-2 text-left" onClick={() => setAperto((v) => !v)}>
        <span className="text-enel-ink/80 flex items-center gap-1.5">
          <span className="text-enel-navy text-[10px]">{aperto ? '▾' : '▸'}</span>
          {label}
        </span>
        <span className="font-semibold">{euro(valore)}</span>
      </button>
      {aperto && (
        <div className="pb-2 pl-4 space-y-1">
          {righe.map((r, i) => (
            <div key={i} className="flex justify-between text-xs text-enel-ink/50">
              <span>di cui {r.etichetta.toLowerCase()}</span>
              <span>{euro(r.valore)}</span>
            </div>
          ))}
        </div>
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
