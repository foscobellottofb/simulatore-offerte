import { Offerta, ParametroDettaglio, InputSimulazione, RisultatoCalcolo, RigaConfronto } from './types';

/**
 * NOTA IMPORTANTE
 * ----------------
 * Questa è una formula di calcolo "ragionevole ma semplificata", ricostruita
 * dai valori che comparivano nel tuo report Power BI per il caso di esempio
 * (5.000 kWh/anno, 20 kW, 60 giorni fattura). Non è la formula ufficiale
 * Enel per accise, oneri di rete e IVA, che dipende da scaglioni di
 * potenza/consumo e da delibere ARERA aggiornate periodicamente.
 *
 * Prima di usarla con i clienti, fai validare i coefficienti (o l'intera
 * formula) da chi in azienda gestisce oggi il file Excel/Power BI: qui la
 * priorità è avere una struttura corretta e facilmente sostituibile, non
 * indovinare la formula esatta.
 */

const GIORNI_RIFERIMENTO = 60; // i parametri di dettaglio sono tarati su una fattura di 60 giorni

function offerteFiltrabile(offerta: Offerta, input: InputSimulazione): boolean {
  if (!offerta.attiva) return false;
  if (offerta.commodity !== input.commodity) return false;
  if (offerta.commodity === 'GAS') return true; // la potenza non si applica al gas
  const min = offerta.potenzaMinKw ?? 0;
  const max = offerta.potenzaMaxKw ?? Infinity;
  return input.potenzaKw >= min && input.potenzaKw <= max;
}

export function filtraOfferteDisponibili(offerte: Offerta[], input: InputSimulazione): Offerta[] {
  return offerte.filter((o) => offerteFiltrabile(o, input));
}

function prezzoEnergiaUnitario(offerta: Offerta): number {
  if (offerta.tipoPrezzo === 'FISSO' || offerta.tipoPrezzo === 'PERSONALIZZATA') {
    return offerta.prezzoFisso ?? 0;
  }
  // VARIABILE_CAP: senza un indice PUN live usiamo il CAP come scenario
  // prudenziale (il prezzo massimo che il cliente pagherebbe).
  return offerta.cap ?? offerta.parametroAlfa ?? 0;
}

export function calcolaOfferta(
  offerta: Offerta,
  input: InputSimulazione,
  parametri: ParametroDettaglio[]
): RisultatoCalcolo {
  const fattoreGiorni = input.giorniFattura / GIORNI_RIFERIMENTO;
  const consumoFatturato = (input.consumoAnnuoKwh * input.giorniFattura) / 365;

  const prezzoUnitario = prezzoEnergiaUnitario(offerta);
  const spesaEnergia = prezzoUnitario * consumoFatturato;
  const spesaCcv = offerta.ccvMensile * (input.giorniFattura / 30);

  const paramCommodity = parametri.filter(
    (p) => p.commodity === input.commodity || p.commodity === null
  );

  const righeDettaglio: RigaConfronto[] = [];
  let totaleVociFisse = 0;
  let ivaPercentuale = 0;

  for (const p of paramCommodity) {
    if (p.unita === '%') {
      // Le percentuali (tipicamente l'IVA) si applicano al subtotale, non si sommano qui.
      if (p.chiave.startsWith('IVA')) ivaPercentuale = p.valore;
      continue;
    }
    const valoreScalato = p.unita === '€/fattura' ? p.valore * fattoreGiorni : p.valore;
    righeDettaglio.push({ categoria: p.categoria, etichetta: p.etichetta, valore: valoreScalato });
    totaleVociFisse += valoreScalato;
  }

  const totaleImponibile = spesaEnergia + spesaCcv + totaleVociFisse;
  const iva = totaleImponibile * (ivaPercentuale / 100);
  const totaleBolletta = totaleImponibile + iva;

  return {
    offerta,
    spesaEnergia,
    spesaCcv,
    righeDettaglio,
    totaleImponibile,
    iva,
    totaleBolletta
  };
}

export function calcolaTutteLeOfferte(
  offerte: Offerta[],
  input: InputSimulazione,
  parametri: ParametroDettaglio[]
): RisultatoCalcolo[] {
  return filtraOfferteDisponibili(offerte, input)
    .map((o) => calcolaOfferta(o, input, parametri))
    .sort((a, b) => a.totaleBolletta - b.totaleBolletta);
}

/**
 * Calcolo del "totale concorrente" a partire dai due soli dati che l'utente
 * inserisce (prezzo kWh e CCV): tutte le altre voci (accise, IVA, oneri di
 * rete...) restano quelle configurate nei parametri di dettaglio, come
 * richiesto - l'idea è isolare la sola componente su cui il concorrente
 * compete davvero (materia energia + commercializzazione).
 */
export function calcolaConcorrente(
  prezzoKwh: number,
  ccvMensile: number,
  input: InputSimulazione,
  parametri: ParametroDettaglio[]
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
    scontoPercento: null,
    attiva: true,
    note: null
  };
  return calcolaOfferta(offertaFittizia, input, parametri);
}
