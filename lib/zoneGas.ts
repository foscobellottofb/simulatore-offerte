/**
 * Le tariffe di distribuzione/trasporto del gas naturale, a differenza della
 * luce, NON sono uniformi su tutto il territorio nazionale: ARERA le approva
 * per 6 macro-zone ("ambiti tariffari"), ciascuna con una propria quota
 * fissa (€/PDR/anno) e una propria quota variabile (€/Smc). Si aggiornano
 * inoltre trimestralmente per la parte "oneri di sistema".
 *
 * Fonte: ARERA, "Tariffe di distribuzione, misura e oneri generali" —
 * https://www.arera.it/area-operatori/prezzi-e-tariffe/tariffe-di-distribuzione-misura-oneri-generali
 *
 * Questo file elenca solo i NOMI delle zone; i VALORI numerici sono nella
 * tabella ParametroDettaglio (editabili da Admin → Dati e parametri), con
 * chiave nel formato `GAS_TRASPORTO_FISSO_<ZONA>`, `GAS_TRASPORTO_VARIABILE_<ZONA>`,
 * `GAS_ONERI_FISSO_<ZONA>` dove <ZONA> è lo slug qui sotto.
 */

export const ZONE_GAS = [
  'Nord Occidentale',
  'Nord Orientale',
  'Centrale',
  'Centro-Sud Orientale',
  'Centro-Sud Occidentale',
  'Sud e Isole'
] as const;

export const ZONA_GAS_DEFAULT = 'Nord Orientale';

/** Converte "Centro-Sud Orientale" in "CENTRO_SUD_ORIENTALE" per costruire le chiavi dei parametri. */
export function slugZonaGas(zona: string): string {
  return zona
    .toUpperCase()
    .replace(/-/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}
