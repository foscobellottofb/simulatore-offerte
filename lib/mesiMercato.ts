/**
 * Mesi da aggiornare per PUN e PSV dal web.
 * Si aggiornano solo mesi CONCLUSI (il valore medio mensile si calcola a mese
 * finito), partendo dall'ultimo e andando indietro di "quanti" mesi.
 * Es. il 9 novembre 2026 con quanti=3 → ottobre, settembre, agosto 2026.
 */

export const NOMI_MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

export const MAX_MESI_SYNC = 24;

export type MeseAnno = { anno: number; mese: number };

export function nomeMese(m: MeseAnno) {
  return `${NOMI_MESI[m.mese - 1]} ${m.anno}`;
}

/** Legge "mesi" dal corpo della richiesta: numero intero 1..24, default 1. */
export function quantiMesiDaBody(body: unknown): number {
  const n = Number((body as { mesi?: unknown } | null)?.mesi);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_MESI_SYNC, Math.max(1, Math.round(n)));
}

/** Ultimi "quanti" mesi conclusi secondo il calendario italiano, dal più recente. */
export function ultimiMesiConclusi(quanti: number, adesso: Date = new Date()): MeseAnno[] {
  const oggi = new Date(adesso.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  let anno = oggi.getFullYear();
  let mese = oggi.getMonth() + 1; // mese corrente, non ancora concluso
  const risultato: MeseAnno[] = [];
  for (let i = 0; i < quanti; i++) {
    mese -= 1;
    if (mese === 0) {
      mese = 12;
      anno -= 1;
    }
    risultato.push({ anno, mese });
  }
  return risultato;
}
