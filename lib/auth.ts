import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Autenticazione minimale per l'area Admin: un'unica password condivisa
 * (variabile d'ambiente ADMIN_PASSWORD su Vercel), nessun database di utenti.
 * Adatta per un piccolo team interno che deve solo tenere fuori i clienti,
 * non per un vero controllo accessi multi-utente.
 *
 * Il cookie di sessione NON contiene la password: contiene un token = HMAC
 * calcolato con la password come chiave segreta. Solo chi conosce
 * ADMIN_PASSWORD (cioè il server) può ricalcolare lo stesso token, quindi il
 * cookie non è falsificabile senza indovinare la password.
 */

export const COOKIE_NAME = 'enel_admin_session';

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? '';
}

export function passwordConfigurata(): boolean {
  return secret().length > 0;
}

export function passwordCorretta(pw: string): boolean {
  if (!passwordConfigurata()) return false;
  return pw === secret();
}

export function tokenSessione(): string {
  return createHmac('sha256', secret()).update('enel-admin-session').digest('hex');
}

export function tokenValido(token: string | undefined | null): boolean {
  if (!token || !passwordConfigurata()) return false;
  const atteso = tokenSessione();
  const a = Buffer.from(token);
  const b = Buffer.from(atteso);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
