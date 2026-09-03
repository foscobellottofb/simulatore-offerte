import { Offerta, ParametroDettaglio, InputSimulazione, RisultatoCalcolo, RigaConfronto, FasciaRete } from './types';
import { calcolaCostiRete, ACCISA_LUCE_KWH_DEFAULT, TRASMISSIONE_KWH_DEFAULT, MISURA_ANNO_DEFAULT, FASCE_DEFAULT } from './tariffeLuce';

/**
 * Motore di calcolo bolletta, verificato contro 2 bollette reali Enel Flex
 * Impresa Pmi (periodo giu-lug 2026 e apr-mag 2026, POD IT001E04775530).
 *
 * Formula confermata dalle bollette:
 *   Imponibile = spesa energia (materia prima, dal listino offerta)
 *              + CCV (corrispettivo di vendita)
 *              + costi di rete (distribuzione + trasmissione + misura, sia
 *                quota fissa che potenza che energia)
 *              + oneri di sistema (ASOS + ARIM)
 *              + accisa
 *              + altre voci (eventuali, di default 0)
 *   IVA = 22% dell'imponibile
 *   Totale = Imponibile + IVA
 *
 * Le "altre partite" che si vedono in bolletta (interessi di mora, spese di
 * sollecito) sono penali una tantum non legate al consumo: non fanno parte
 * di una simulazione di offerta e sono volutamente escluse qui.
 */

const GIORNI_ANNO = 365;

/**
 * Consumo nel periodo fatturato: se l'utente ha inserito direttamente il
 * consumo del periodo (es. letto dalla bolletta concorrente per 30/60
 * giorni), lo usa così com'è, senza passare per un annuo stimato. Se invece
 * ha inserito un consumo annuo, lo scala sui giorni fattura.
 */
export function consumoNelPeriodo(input: InputSimulazione): number {
  return input.tipoConsumo === 'PERIODO' ? input.consumoKwh : input.consumoKwh * (input.giorniFattura / GIORNI_ANNO);
}

function offerteFiltrabile(offerta: Offerta, input: InputSimulazione): boolean {
  if (!offerta.attiva) return false;
  if (offerta.commodity !== input.commodity) return false;
  if (offerta.commodity === 'GAS') return true;
  const min = offerta.potenzaMinKw ?? 0;
  const max = offerta.potenzaMaxKw ?? Infinity;
  return input.potenzaKw >= min && input.potenzaKw <= max;
}

export function filtraOfferteDisponibili(offerte: Offerta[], input: InputSimulazione): Offerta[] {
  return offerte.filter((o) => offerteFiltrabile(o, input));
}

/**
 * Prezzo medio dell'energia per kWh, per offerte a fasce orarie.
 *
 * La maggior parte delle offerte ha un solo prezzo (F1), valido per tutte le
 * ore: in quel caso F2/F3 sono vuoti e il prezzo è semplicemente F1.
 *
 * Offerte come "Ore Happy" hanno anche un prezzo F2 (e in teoria F3), diverso
 * da F1, valido solo in certe ore del giorno. Non conosciamo la lettura oraria
 * reale del cliente, quindi chi usa il simulatore stima manualmente che quota
 * del consumo ricade in F2 (e in F3): il resto va in F1. Il prezzo medio è la
 * media pesata dei prezzi di fascia, ciascuno mantenuto esattamente come
 * inserito in Admin, senza derivarlo da percentuali di sconto.
 */
function prezzoEnergiaUnitario(offerta: Offerta, input: InputSimulazione): number {
  if (offerta.tipoPrezzo === 'FISSO' || offerta.tipoPrezzo === 'PERSONALIZZATA') {
    const f1 = offerta.prezzoFisso ?? 0;
    const quotaF2 = offerta.prezzoF2 != null && input.percentualeConsumoF2 ? Math.min(Math.max(input.percentualeConsumoF2, 0), 100) / 100 : 0;
    const quotaF3 = offerta.prezzoF3 != null && input.percentualeConsumoF3 ? Math.min(Math.max(input.percentualeConsumoF3, 0), 100) / 100 : 0;
    const quotaF1 = Math.max(0, 1 - quotaF2 - quotaF3);
    return f1 * quotaF1 + (offerta.prezzoF2 ?? 0) * quotaF2 + (offerta.prezzoF3 ?? 0) * quotaF3;
  }
  // VARIABILE_CAP: senza un indice PUN/PSV live usiamo il CAP come scenario
  // prudenziale (il prezzo massimo che il cliente pagherebbe).
  return offerta.cap ?? offerta.parametroAlfa ?? 0;
}

function parametroValore(parametri: ParametroDettaglio[], chiave: string, fallback = 0): number {
  return parametri.find((p) => p.chiave === chiave)?.valore ?? fallback;
}

export function calcolaOfferta(
  offerta: Offerta,
  input: InputSimulazione,
  parametri: ParametroDettaglio[],
  fasceRete: FasciaRete[] = FASCE_DEFAULT
): RisultatoCalcolo {
  const fattoreAnno = input.giorniFattura / GIORNI_ANNO; // usato per annualizzare le quote fisse/potenza di rete
  const consumoFatturato = consumoNelPeriodo(input);

  const prezzoUnitario = prezzoEnergiaUnitario(offerta, input);
  const spesaEnergia = prezzoUnitario * consumoFatturato;
  const spesaCcv = offerta.ccvMensile * (input.giorniFattura / 30);

  const fasceAttive: string[] = [];
  if (offerta.prezzoF2 != null && input.percentualeConsumoF2) {
    fasceAttive.push(`F2 ore ${offerta.oreInizioF2 ?? '?'}-${offerta.oreFineF2 ?? '?'} su ${input.percentualeConsumoF2}% del consumo`);
  }
  if (offerta.prezzoF3 != null && input.percentualeConsumoF3) {
    fasceAttive.push(`F3 ore ${offerta.oreInizioF3 ?? '?'}-${offerta.oreFineF3 ?? '?'} su ${input.percentualeConsumoF3}% del consumo`);
  }

  const righeDettaglio: RigaConfronto[] = [];
  let totaleVociFisse = 0;

  righeDettaglio.push(
    {
      categoria: 'Spesa energia',
      etichetta:
        fasceAttive.length > 0
          ? `Spesa per la vendita di energia elettrica (${fasceAttive.join(', ')})`
          : 'Spesa per la vendita di energia elettrica',
      valore: spesaEnergia,
      gruppo: 'CONSUMI'
    },
    { categoria: 'Quota fissa', etichetta: 'Corrispettivo di vendita (CCV)', valore: spesaCcv, gruppo: 'FISSA_POTENZA' }
  );

  if (input.commodity === 'LUCE') {
    const trasmissioneKwh = parametroValore(parametri, 'TRASMISSIONE_LUCE_KWH', TRASMISSIONE_KWH_DEFAULT);
    const misuraAnno = parametroValore(parametri, 'MISURA_LUCE_ANNO', MISURA_ANNO_DEFAULT);
    const accisaKwh = parametroValore(parametri, 'ACCISA_LUCE_KWH', ACCISA_LUCE_KWH_DEFAULT);

    const rete = calcolaCostiRete(input.potenzaKw, fasceRete, trasmissioneKwh, misuraAnno);
    const speseFisseRete = rete.fissaAnno * fattoreAnno;
    const spesePotenza = rete.potenzaAnnoPerKw * input.potenzaKw * fattoreAnno;
    const speseEnergiaRete = rete.energiaKwh * consumoFatturato;
    const accisa = accisaKwh * consumoFatturato;

    righeDettaglio.push(
      { categoria: 'Trasporto e oneri di sistema', etichetta: `Quota fissa (fascia ${rete.fascia})`, valore: speseFisseRete, gruppo: 'FISSA_POTENZA' },
      { categoria: 'Trasporto e oneri di sistema', etichetta: 'Quota potenza', valore: spesePotenza, gruppo: 'FISSA_POTENZA' },
      { categoria: 'Trasporto e oneri di sistema', etichetta: 'Quota energia (trasmissione + oneri)', valore: speseEnergiaRete, gruppo: 'CONSUMI' },
      { categoria: 'Accise e IVA', etichetta: 'Accisa energia elettrica', valore: accisa, gruppo: 'ACCISE' }
    );
    totaleVociFisse = speseFisseRete + spesePotenza + speseEnergiaRete + accisa;
  } else {
    // GAS: la formula ARERA per distribuzione/oneri gas non è ancora presente
    // nel foglio parametri fornito. Uso i parametri di dettaglio manuali
    // (tab "Parametri di dettaglio" in Admin) come approssimazione, in attesa
    // di un foglio tariffe gas equivalente a quello luce.
    const paramGas = parametri.filter((p) => p.commodity === 'GAS' && p.unita !== '%' && !p.chiave.startsWith('ALTRE_VOCI'));
    for (const p of paramGas) {
      const valoreScalato = p.unita === '€/fattura' ? p.valore * (input.giorniFattura / 30) : p.valore * consumoFatturato;
      const gruppo: RigaConfronto['gruppo'] = p.categoria === 'Accise e IVA' ? 'ACCISE' : 'FISSA_POTENZA';
      righeDettaglio.push({ categoria: p.categoria, etichetta: p.etichetta, valore: valoreScalato, gruppo });
      totaleVociFisse += valoreScalato;
    }
  }

  const altreVoci = parametroValore(parametri, input.commodity === 'LUCE' ? 'ALTRE_VOCI_LUCE' : 'ALTRE_VOCI_GAS', 0);
  if (altreVoci) {
    righeDettaglio.push({ categoria: 'Altre voci', etichetta: 'Altre voci', valore: altreVoci, gruppo: 'ALTRE' });
    totaleVociFisse += altreVoci;
  }

  const ivaPercentuale = parametroValore(parametri, input.commodity === 'LUCE' ? 'IVA_PERC_LUCE' : 'IVA_PERC_GAS', 22);

  const totaleImponibile = spesaEnergia + spesaCcv + totaleVociFisse;
  const iva = totaleImponibile * (ivaPercentuale / 100);
  const totaleBolletta = totaleImponibile + iva;

  const sommaGruppo = (g: RigaConfronto['gruppo']) => righeDettaglio.filter((r) => r.gruppo === g).reduce((s, r) => s + r.valore, 0);

  const riepilogo = {
    quotaConsumi: sommaGruppo('CONSUMI'),
    quotaFissaEPotenza: sommaGruppo('FISSA_POTENZA'),
    altrePartite: sommaGruppo('ALTRE'),
    acciseEIva: sommaGruppo('ACCISE') + iva
  };

  return { offerta, spesaEnergia, spesaCcv, righeDettaglio, riepilogo, totaleImponibile, iva, totaleBolletta };
}

export function calcolaTutteLeOfferte(
  offerte: Offerta[],
  input: InputSimulazione,
  parametri: ParametroDettaglio[],
  fasceRete: FasciaRete[] = FASCE_DEFAULT
): RisultatoCalcolo[] {
  return filtraOfferteDisponibili(offerte, input)
    .map((o) => calcolaOfferta(o, input, parametri, fasceRete))
    .sort((a, b) => a.totaleBolletta - b.totaleBolletta);
}

/**
 * Calcolo del "totale concorrente" a partire dai due soli dati che l'utente
 * inserisce (prezzo kWh e CCV): tutte le altre voci (rete, oneri, accisa,
 * IVA...) restano quelle regolate uguali per tutti i fornitori.
 */
export function calcolaConcorrente(
  prezzoKwh: number,
  ccvMensile: number,
  input: InputSimulazione,
  parametri: ParametroDettaglio[],
  fasceRete: FasciaRete[] = FASCE_DEFAULT
): RisultatoCalcolo {
  const offertaFittizia: Offerta = {
    id: 'concorrente',
    nome: 'Offerta concorrente',
    commodity: input.commodity,
    tipoPrezzo: 'FISSO',
    potenzaMinKw: null,
    potenzaMaxKw: null,
    prezzoFisso: prezzoKwh,
    parametroAlfa: null,
    cap: null,
    ccvMensile,
    durataMesi: 12,
    disponibileTablet: false,
    disponibileCartaceo: false,
    canalePreferenziale: null,
    vendibilita: '-',
    strutturaPrezzo: 'Monoraria',
    prezzoF2: null,
    oreInizioF2: null,
    oreFineF2: null,
    prezzoF3: null,
    oreInizioF3: null,
    oreFineF3: null,
    richiedeContatore2G: false,
    attiva: true,
    note: null
  };
  return calcolaOfferta(offertaFittizia, input, parametri, fasceRete);
}
