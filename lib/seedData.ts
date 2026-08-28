import { Commodity, TipoPrezzo } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Offerte ricostruite dal foglio "Import SharePoint" del tuo file Excel
 * (CTE_Enel_SMB_import_SharePoint.xlsx, versione con dati aggiornati al
 * 28/07/2026). "Enel Business Luce" è stata rimossa perché il file segnala
 * "non più presente nel selettore offerte".
 *
 * ATTENZIONE - DISCREPANZE COL FOGLIO "Verifica CTE":
 * Il foglio di verifica (letto dai PDF ufficiali) riporta per alcune offerte
 * prezzi diversi da quelli del foglio "Import SharePoint". Le ho segnalate
 * nel campo note di ogni offerta interessata: andrebbero verificate con chi
 * gestisce le CTE prima di usare il simulatore con i clienti, perché sono
 * differenze non piccole (es. Enel Fix Business Gas: 0,74 qui vs 0,66 nella
 * CTE, con uno sconto promozionale a 0,561 legato ad avere anche la luce Enel).
 */
export const OFFERTE_SEED: Prisma.OffertaCreateManyInput[] = [
  {
    nome: 'Enel Fix Business Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.FISSO,
    potenzaMinKw: 0,
    potenzaMaxKw: 15,
    prezzoFisso: 0.173,
    ccvMensile: 12,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: false,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI'
  },
  {
    nome: 'Enel Business Super Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.FISSO,
    potenzaMinKw: 3,
    potenzaMaxKw: 25,
    prezzoFisso: 0.15899,
    ccvMensile: 16,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'Verifica CTE riporta 0,16100 €/kWh (CCV 180 €/POD/anno): da confermare quale sia il prezzo corrente.'
  },
  {
    nome: 'Enel Fix Business Start Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.FISSO,
    potenzaMinKw: 0,
    potenzaMaxKw: 25,
    prezzoFisso: 0.18706,
    ccvMensile: 16,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'Verifica CTE riporta 0,17889 €/kWh: da confermare quale sia il prezzo corrente.'
  },
  {
    nome: 'Enel Business WOW Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.FISSO,
    potenzaMinKw: 3,
    potenzaMaxKw: 25,
    prezzoFisso: 0.158,
    ccvMensile: 13,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI'
  },
  {
    nome: 'Enel Flex Control Business Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.VARIABILE_CAP,
    potenzaMinKw: 0,
    potenzaMaxKw: 15,
    parametroAlfa: 0.025,
    cap: 0.163,
    ccvMensile: 17,
    durataMesi: 12,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'DUAL / MULTI',
    note: 'Verifica CTE: alfa 0,025 confermato; CAP indicato come "PUN cap 0,1518 + alfa" = 0,1768 €/kWh, diverso dal CAP 0,163 qui riportato. Da chiarire quale CAP usare.'
  },
  {
    nome: 'Enel Flex Control Impresa Luce',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.VARIABILE_CAP,
    potenzaMinKw: 15,
    potenzaMaxKw: 25,
    parametroAlfa: 0.031,
    cap: 0.169,
    ccvMensile: 30,
    durataMesi: 12,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'Verifica CTE riporta alfa 0,034 (non 0,031) e CAP massimo energia 0,1858 €/kWh (PUN cap 0,1518 + alfa). Da confermare.'
  },
  {
    nome: 'Enel Business Ore Happy 12-15',
    commodity: Commodity.LUCE,
    tipoPrezzo: TipoPrezzo.PERSONALIZZATA,
    potenzaMinKw: 3,
    potenzaMaxKw: 25,
    prezzoFisso: 0.173,
    ccvMensile: 16,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: false,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    strutturaPrezzo: 'Personalizzata',
    scontoPercento: 0.0865,
    oreInizioAgevolazione: 12,
    oreFineAgevolazione: 15,
    scontoDalMese: 2,
    richiedeContatore2G: true,
    note: 'Sconto sulla fascia 12-15 attivo dal 2° mese, richiede contatore 2G. Verifica CTE: prezzo listino 0,16600 €/kWh (non 0,173) e prezzo agevolato 0,08300 (non 0,0865, ma sconto 50% coerente). Da confermare quale coppia di valori usare.'
  },
  {
    nome: 'Enel Fix Business Gas',
    commodity: Commodity.GAS,
    tipoPrezzo: TipoPrezzo.FISSO,
    prezzoFisso: 0.74,
    ccvMensile: 15,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: false,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'Verifica CTE riporta listino 0,6600 €/Smc con sconto 15% (0,5610 €/Smc) subordinato ad avere/attivare una fornitura luce Enel non domestica: differenza rilevante dal valore qui riportato, da chiarire prima dell\'uso commerciale.'
  },
  {
    nome: 'Enel Fix Business Start Gas',
    commodity: Commodity.GAS,
    tipoPrezzo: TipoPrezzo.FISSO,
    prezzoFisso: 0.74,
    ccvMensile: 15,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'Verifica CTE riporta 0,6600 €/Smc (non 0,74): da confermare quale sia il prezzo corrente. Valido per consumi sotto 10.000 Smc/anno.'
  },
  {
    nome: 'Enel Flex Control Business Gas',
    commodity: Commodity.GAS,
    tipoPrezzo: TipoPrezzo.VARIABILE_CAP,
    parametroAlfa: 0.17,
    cap: 0.8579,
    ccvMensile: 20,
    durataMesi: 12,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL / MULTI',
    note: 'CAP 0,8579 €/Smc confermato dalla Verifica CTE (CAP sul solo PSV + alfa = costo massimo materia prima).'
  },
  {
    nome: 'Enel Business WOW Gas',
    commodity: Commodity.GAS,
    tipoPrezzo: TipoPrezzo.FISSO,
    prezzoFisso: 0.74,
    ccvMensile: 15,
    durataMesi: 24,
    disponibileTablet: true,
    disponibileCartaceo: true,
    canalePreferenziale: 'Tablet',
    vendibilita: 'SINGLE / DUAL'
  }
];

/**
 * Parametri di dettaglio residui, editabili da Admin. Le componenti di rete
 * (distribuzione, trasmissione, misura, oneri ASOS/ARIM) e l'accisa luce
 * sono ora calcolate automaticamente per fascia di potenza da
 * lib/tariffeLuce.ts (dati ARERA ufficiali) e non sono più qui: quei valori
 * non erano editabili a mano senza rischiare di sbagliare formula.
 */
export const PARAMETRI_SEED: Prisma.ParametroDettaglioCreateManyInput[] = [
  { chiave: 'IVA_PERC_LUCE', etichetta: 'IVA', categoria: 'Accise e IVA', commodity: Commodity.LUCE, valore: 22, unita: '%', ordinamento: 1 },
  { chiave: 'ALTRE_VOCI_LUCE', etichetta: 'Altre voci (una tantum, es. solleciti)', categoria: 'Altre voci', commodity: Commodity.LUCE, valore: 0, unita: '€/fattura', ordinamento: 2 },
  { chiave: 'ACCISA_GAS_SMC', etichetta: 'Accisa gas', categoria: 'Accise e IVA', commodity: Commodity.GAS, valore: 0, unita: '€/Smc', ordinamento: 1 },
  { chiave: 'IVA_PERC_GAS', etichetta: 'IVA', categoria: 'Accise e IVA', commodity: Commodity.GAS, valore: 22, unita: '%', ordinamento: 2 },
  { chiave: 'ALTRE_VOCI_GAS', etichetta: 'Altre voci (una tantum, es. solleciti)', categoria: 'Altre voci', commodity: Commodity.GAS, valore: 0, unita: '€/fattura', ordinamento: 3 }
];
