import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Le password non vengono mai salvate in chiaro nel database: si salva solo
 * un'impronta (hash scrypt + "sale" casuale). Nemmeno chi apre il database
 * può risalire alla password originale.
 * Solo lato server (Node), non importare da middleware.ts.
 */

export const LUNGHEZZA_MINIMA_PASSWORD = 8;

export function hashPassword(password: string): string {
  const sale = randomBytes(16).toString('hex');
  const hash = scryptSync(password, sale, 64).toString('hex');
  return `scrypt$${sale}$${hash}`;
}

export function verificaPassword(password: string, salvata: string): boolean {
  const [tipo, sale, hash] = salvata.split('$');
  if (tipo !== 'scrypt' || !sale || !hash) return false;
  const calcolato = scryptSync(password, sale, 64);
  const atteso = Buffer.from(hash, 'hex');
  return atteso.length === calcolato.length && timingSafeEqual(atteso, calcolato);
}

/** Nome utente normalizzato: minuscolo, senza spazi ai lati. */
export function normalizzaUsername(u: unknown): string {
  return typeof u === 'string' ? u.trim().toLowerCase() : '';
}

export function erroreUsername(u: string): string | null {
  if (u.length < 3) return 'Il nome utente deve avere almeno 3 caratteri.';
  if (!/^[a-z0-9._@+-]+$/.test(u)) return 'Il nome utente può contenere solo lettere, numeri e . _ @ + -';
  return null;
}

export function errorePassword(p: unknown): string | null {
  if (typeof p !== 'string' || p.length < LUNGHEZZA_MINIMA_PASSWORD)
    return `La password deve avere almeno ${LUNGHEZZA_MINIMA_PASSWORD} caratteri.`;
  return null;
}
