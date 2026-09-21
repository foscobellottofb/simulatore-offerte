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
 *
 * Usa Web Crypto (crypto.subtle) invece del modulo Node 'crypto': questo
 * file viene importato anche da middleware.ts, che su Vercel esegue in Edge
 * Runtime — dove il modulo 'crypto' di Node non è disponibile, mentre
 * crypto.subtle sì (è uno standard web, non specifico di Node).
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

async function hmacSha256Hex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ]);
  const firma = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(firma))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function tokenSessione(): Promise<string> {
  return hmacSha256Hex('enel-admin-session', secret());
}

// Confronto a tempo costante: il token è un digest HMAC (non la password),
// quindi il rischio di timing attack è basso, ma manteniamo comunque un
// confronto che non esce anticipatamente al primo carattere diverso.
export async function tokenValido(token: string | undefined | null): Promise<boolean> {
  if (!token || !passwordConfigurata()) return false;
  const atteso = await tokenSessione();
  if (token.length !== atteso.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ atteso.charCodeAt(i);
  return diff === 0;
}
