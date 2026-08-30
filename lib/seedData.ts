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
 * Parametri di dettaglio editabili da Admin: accise, IVA, "altre voci" e le
 * componenti di rete comuni a tutte le fasce di potenza (trasmissione,
 * misura). Le componenti che invece VARIANO per fascia di potenza
 * (distribuzione, ASOS, ARIM) sono nel modello FasciaRete qui sotto, così da
 * poterle mostrare in Admin come una tabella per fascia (BTA1..BTA6) invece
 * che come righe piatte senza contesto.
 */
export const PARAMETRI_SEED: Prisma.ParametroDettaglioCreateManyInput[] = [
  { chiave: 'IVA_PERC_LUCE', etichetta: 'IVA', categoria: 'Accise e IVA', commodity: Commodity.LUCE, valore: 22, unita: '%', ordinamento: 1 },
  { chiave: 'ACCISA_LUCE_KWH', etichetta: 'Accisa energia elettrica', categoria: 'Accise e IVA', commodity: Commodity.LUCE, valore: 0.0125, unita: '€/kWh', ordinamento: 2 },
  { chiave: 'ALTRE_VOCI_LUCE', etichetta: 'Altre voci (una tantum, es. solleciti)', categoria: 'Altre voci', commodity: Commodity.LUCE, valore: 0, unita: '€/fattura', ordinamento: 3 },
  { chiave: 'TRASMISSIONE_LUCE_KWH', etichetta: 'Tariffa trasmissione', categoria: 'Rete e oneri (comuni a tutte le fasce)', commodity: Commodity.LUCE, valore: 0.0119, unita: '€/kWh', ordinamento: 1 },
  { chiave: 'MISURA_LUCE_ANNO', etichetta: 'Tariffa misura', categoria: 'Rete e oneri (comuni a tutte le fasce)', commodity: Commodity.LUCE, valore: 19.6826, unita: '€/POD/anno', ordinamento: 2 },
  { chiave: 'ACCISA_GAS_SMC', etichetta: 'Accisa gas', categoria: 'Accise e IVA', commodity: Commodity.GAS, valore: 0, unita: '€/Smc', ordinamento: 1 },
  { chiave: 'IVA_PERC_GAS', etichetta: 'IVA', categoria: 'Accise e IVA', commodity: Commodity.GAS, valore: 22, unita: '%', ordinamento: 2 },
  { chiave: 'ALTRE_VOCI_GAS', etichetta: 'Altre voci (una tantum, es. solleciti)', categoria: 'Altre voci', commodity: Commodity.GAS, valore: 0, unita: '€/fattura', ordinamento: 3 }
];

/**
 * Componenti di rete ARERA per fascia di potenza BTA1..BTA6 (energia elettrica).
 * Prima erano hardcoded in lib/tariffeLuce.ts; ora sono qui, in DB, editabili
 * da Admin → "Rete e oneri". Fonte: foglio "Parametri simulatore" del file
 * CTE_Enel_SMB_import_SharePoint.xlsx.
 *
 * ATTENZIONE: gli oneri ASOS/ARIM sono validi solo per il trimestre
 * 01/07/2026-30/09/2026 (cambiano ogni trimestre con delibera ARERA) — vanno
 * aggiornati da questa stessa pagina Admin ogni trimestre, senza toccare il codice.
 */
export const FASCE_RETE_SEED: Prisma.FasciaReteCreateManyInput[] = [
  {
    commodity: Commodity.LUCE, fascia: 'BTA1', etichetta: 'Potenza impegnata ≤ 1,5 kW', minKw: 0, maxKw: 1.5, ordinamento: 1,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 32.9297, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.8164, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.4524, arimEnergiaKwh: 0.001616
  },
  {
    commodity: Commodity.LUCE, fascia: 'BTA2', etichetta: 'Potenza > 1,5 e ≤ 3 kW', minKw: 1.5, maxKw: 3, ordinamento: 2,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 31.1874, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.0328, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.27, arimEnergiaKwh: 0.001616
  },
  {
    commodity: Commodity.LUCE, fascia: 'BTA3', etichetta: 'Potenza > 3 e ≤ 6 kW', minKw: 3, maxKw: 6, ordinamento: 3,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    commodity: Commodity.LUCE, fascia: 'BTA4', etichetta: 'Potenza > 6 e ≤ 10 kW', minKw: 6, maxKw: 10, ordinamento: 4,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    commodity: Commodity.LUCE, fascia: 'BTA5', etichetta: 'Potenza > 10 kW', minKw: 10, maxKw: null, ordinamento: 5,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    commodity: Commodity.LUCE, fascia: 'BTA6', etichetta: 'Potenza disponibile > 16,5 kW', minKw: 16.5, maxKw: null, ordinamento: 6,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 32.9297, distribuzioneEnergiaKwh: 0.00066,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.8164, asosEnergiaKwh: 0.031875,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.4524, arimEnergiaKwh: 0.001614
  }
];

/**
 * Argomenti di supporto al consulente, mostrati nel Confronto concorrenza.
 * Punti generali e prudenti: non citano promozioni o importi specifici,
 * perché quelli vanno verificati con la rete commerciale prima dell'uso.
 * Amministrabili dalla pagina Admin senza toccare il codice.
 */
export const ARGOMENTI_SEED: Prisma.ArgomentoVenditaCreateManyInput[] = [
  { tipo: 'ENEL_VINCE', testo: 'Il prezzo Enel è già più conveniente su questi consumi: si può chiudere facendo leva sul risparmio immediato.', ordinamento: 1 },
  { tipo: 'ENEL_VINCE', testo: 'Nessuna interruzione di fornitura nel passaggio: gestito interamente da Enel.', ordinamento: 2 },
  { tipo: 'ENEL_VINCE', testo: 'Un unico interlocutore per assistenza, fatturazione ed eventuali reclami.', ordinamento: 3 },
  {
    tipo: 'CONCORRENTE_VARIABILE',
    testo:
      "Il prezzo del concorrente è variabile: può salire con l'andamento del mercato energetico. Un'offerta Enel a prezzo fisso protegge il cliente da rincari imprevisti in un contesto di mercato ancora incerto.",
    ordinamento: 1
  },
  {
    tipo: 'CONCORRENTE_FISSO',
    testo: 'A parità di condizioni contrattuali, fai leva sul valore di affidarsi a un fornitore storico con presenza capillare sul territorio, invece che sul solo prezzo.',
    ordinamento: 1
  },
  { tipo: 'GENERALE', testo: 'Rete di assistenza Spazio Enel diffusa sul territorio, oltre al canale telefonico dedicato Business.', ordinamento: 10 },
  { tipo: 'GENERALE', testo: 'Un solo fornitore per luce e gas semplifica gestione, fatturazione e assistenza.', ordinamento: 11 },
  { tipo: 'GENERALE', testo: 'Verifica se sono attive promozioni o vantaggi dedicati ai clienti Enel Business per questo periodo (non inclusi in questo calcolo).', ordinamento: 12 },
  { tipo: 'GENERALE', testo: 'Solidità di un operatore storico: minore rischio di disservizi o cambi di condizioni improvvisi.', ordinamento: 13 }
];

/**
 * Valori medi mensili del PUN Index GME (€/MWh), per il grafico multi-anno
 * della pagina pubblica "/mercato".
 *
 * FONTE: non è stato possibile un accesso automatico diretto al sito GME
 * (mercatoelettrico.org) in fase di sviluppo; questi valori sono stati
 * ricostruiti da più fonti secondarie che pubblicano l'indice ufficiale
 * (portali di fornitori ed energy advisor), incrociando i dati dove
 * disponibili. I mesi con "stimato: true" sono quelli per cui non è stata
 * trovata una fonte esplicita e il valore è stato interpolato dal contesto
 * (andamento del mese prima/dopo): usali con cautela e verificali sul sito
 * ufficiale GME (Statistiche → Sintesi MGP) prima di mostrarli a un cliente
 * in modo puntuale. Da Admin → "PUN mensile" puoi correggerli in qualsiasi
 * momento, anche mese per mese quando arriva il dato ufficiale.
 */
export const PUN_MENSILE_SEED: Prisma.PunMensileCreateManyInput[] = [
  // 2024
  { anno: 2024, mese: 1, valoreMwh: 97.0, stimato: true },
  { anno: 2024, mese: 2, valoreMwh: 87.6, stimato: false },
  { anno: 2024, mese: 3, valoreMwh: 85.0, stimato: true },
  { anno: 2024, mese: 4, valoreMwh: 86.8, stimato: false },
  { anno: 2024, mese: 5, valoreMwh: 94.9, stimato: false },
  { anno: 2024, mese: 6, valoreMwh: 103.2, stimato: false },
  { anno: 2024, mese: 7, valoreMwh: 112.3, stimato: false },
  { anno: 2024, mese: 8, valoreMwh: 128.4, stimato: false },
  { anno: 2024, mese: 9, valoreMwh: 117.1, stimato: false },
  { anno: 2024, mese: 10, valoreMwh: 116.7, stimato: false },
  { anno: 2024, mese: 11, valoreMwh: 130.9, stimato: false },
  { anno: 2024, mese: 12, valoreMwh: 135.1, stimato: false },
  // 2025
  { anno: 2025, mese: 1, valoreMwh: 143.0, stimato: false },
  { anno: 2025, mese: 2, valoreMwh: 150.4, stimato: false },
  { anno: 2025, mese: 3, valoreMwh: 120.6, stimato: false },
  { anno: 2025, mese: 4, valoreMwh: 99.9, stimato: false },
  { anno: 2025, mese: 5, valoreMwh: 93.6, stimato: false },
  { anno: 2025, mese: 6, valoreMwh: 111.8, stimato: false },
  { anno: 2025, mese: 7, valoreMwh: 113.1, stimato: false },
  { anno: 2025, mese: 8, valoreMwh: 108.8, stimato: false },
  { anno: 2025, mese: 9, valoreMwh: 109.1, stimato: false },
  { anno: 2025, mese: 10, valoreMwh: 111.0, stimato: false },
  { anno: 2025, mese: 11, valoreMwh: 110.0, stimato: true },
  { anno: 2025, mese: 12, valoreMwh: 113.0, stimato: true },
  // 2026 (fino ad agosto, incluso il parziale)
  { anno: 2026, mese: 1, valoreMwh: 135.0, stimato: false },
  { anno: 2026, mese: 2, valoreMwh: 114.0, stimato: false },
  { anno: 2026, mese: 3, valoreMwh: 120.0, stimato: true },
  { anno: 2026, mese: 4, valoreMwh: 120.0, stimato: true },
  { anno: 2026, mese: 5, valoreMwh: 120.0, stimato: true },
  { anno: 2026, mese: 6, valoreMwh: 154.0, stimato: true },
  { anno: 2026, mese: 7, valoreMwh: 186.2, stimato: false },
  { anno: 2026, mese: 8, valoreMwh: 176.3, stimato: true }
];

/**
 * Tabella vuota di partenza: le offerte dei concorrenti non hanno una fonte
 * pubblica affidabile e vanno inserite a mano dal team commerciale, man mano
 * che le raccogliete sul campo. Struttura pronta, editabile da Admin →
 * "Concorrenza".
 */
export const OFFERTE_CONCORRENTI_SEED: Prisma.OffertaConcorrenteCreateManyInput[] = [];
