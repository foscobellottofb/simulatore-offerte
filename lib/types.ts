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
  scontoPercento: number | null;
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

export interface InputSimulazione {
  commodity: Commodity;
  consumoAnnuoKwh: number;
  potenzaKw: number;
  giorniFattura: number;
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
