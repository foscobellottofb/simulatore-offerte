export type Commodity = 'LUCE' | 'GAS';
export type TipoPrezzo = 'FISSO' | 'VARIABILE_CAP' | 'PERSONALIZZATA';

export interface Offerta {
  id: string;
  nome: string;
  commodity: Commodity;
  tipoPrezzo: TipoPrezzo;
  potenzaMinKw: number | null;
  potenzaMaxKw: number | null;
  prezzoFisso: number | null;
  parametroAlfa: number | null;
  cap: number | null;
  ccvMensile: number;
  durataMesi: number;
  disponibileTablet: boolean;
  disponibileCartaceo: boolean;
  canalePreferenziale: string | null;
  vendibilita: string;
  strutturaPrezzo: string;
  prezzoF2: number | null;
  oreInizioF2: number | null;
  oreFineF2: number | null;
  prezzoF3: number | null;
  oreInizioF3: number | null;
  oreFineF3: number | null;
  richiedeContatore2G: boolean;
  attiva: boolean;
  note: string | null;
}

export interface ParametroDettaglio {
  id: string;
  chiave: string;
  etichetta: string;
  categoria: string;
  commodity: Commodity | null;
  valore: number;
  unita: string;
  ordinamento: number;
}

// Componenti di rete ARERA per fascia di potenza (BTA1..BTA6), editabili da
// Admin → "Rete e oneri". Sostituiscono i valori prima hardcoded in
// lib/tariffeLuce.ts.
export interface FasciaRete {
  id: string;
  commodity: Commodity;
  fascia: string;
  etichetta: string;
  minKw: number;
  maxKw: number | null;
  distribuzioneFissaAnno: number;
  distribuzionePotenzaAnno: number;
  distribuzioneEnergiaKwh: number;
  asosFissaAnno: number;
  asosPotenzaAnno: number;
  asosEnergiaKwh: number;
  arimFissaAnno: number;
  arimPotenzaAnno: number;
  arimEnergiaKwh: number;
  ordinamento: number;
}

export type TipoArgomento = 'ENEL_VINCE' | 'CONCORRENTE_VARIABILE' | 'CONCORRENTE_FISSO' | 'GENERALE';

export interface ArgomentoVendita {
  id: string;
  tipo: TipoArgomento;
  testo: string;
  attivo: boolean;
  ordinamento: number;
}

// Direttiva di contenuto per "Caracozzo AI" (generatore script di vendita),
// editabile da Admin senza toccare il codice.
export interface DirettivaScript {
  id: string;
  testo: string;
  attiva: boolean;
  ordinamento: number;
}

export interface InputSimulazione {
  commodity: Commodity;
  consumoKwh: number; // valore inserito dall'utente: annuale oppure del periodo, secondo tipoConsumo
  tipoConsumo: 'ANNUO' | 'PERIODO';
  potenzaKw: number;
  giorniFattura: number;
  // Ambito tariffario ARERA del punto di fornitura gas (le tariffe di
  // distribuzione/trasporto gas, a differenza della luce, variano per zona
  // geografica). Ignorato per la luce. Vedi lib/zoneGas.ts.
  zonaGas?: string;
  // Per offerte con più fasce orarie (F2, eventualmente F3): quanta parte
  // del consumo del cliente ricade in ciascuna fascia, 0-100. Il resto va
  // in F1. Scelte manualmente da chi usa il simulatore (stima/chiesto al
  // cliente), non calcolate: non abbiamo la lettura oraria reale.
  percentualeConsumoF2?: number;
  percentualeConsumoF3?: number;
}

export type GruppoVoce = 'CONSUMI' | 'FISSA_POTENZA' | 'ACCISE' | 'ALTRE';

export interface RigaConfronto {
  categoria: string;
  etichetta: string;
  valore: number;
  gruppo: GruppoVoce;
}

export interface Riepilogo {
  quotaConsumi: number;
  quotaFissaEPotenza: number;
  altrePartite: number;
  acciseEIva: number;
}

export interface RisultatoCalcolo {
  offerta: Offerta;
  spesaEnergia: number;
  spesaCcv: number;
  righeDettaglio: RigaConfronto[];
  riepilogo: Riepilogo;
  totaleImponibile: number;
  iva: number;
  totaleBolletta: number;
}

// PUN mensile (€/MWh), pagina pubblica "/mercato".
export interface PunMensile {
  id: string;
  anno: number;
  mese: number; // 1..12
  valoreMwh: number;
  stimato: boolean;
}

// PSV mensile (€/Smc), l'equivalente del PUN per il gas, pagina pubblica "/mercato".
export interface PsvMensile {
  id: string;
  anno: number;
  mese: number; // 1..12
  valoreSmc: number;
  stimato: boolean;
}

// Offerta concorrente indicativa, pagina pubblica "/mercato".
export interface OffertaConcorrente {
  id: string;
  fornitore: string;
  nomeOfferta: string;
  commodity: Commodity;
  tipoPrezzo: string; // "FISSO" | "VARIABILE"
  prezzoKwh: number | null;
  ccvMensile: number | null;
  sconto: string | null;
  durataDal: string | null;
  durataAl: string | null;
  canale: string; // "WEB" | "ALTRO"
  note: string | null;
  cteBase64: string | null;
  attiva: boolean;
  ordinamento: number;
}
