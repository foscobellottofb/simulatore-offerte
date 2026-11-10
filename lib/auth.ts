/**
 * Sessione di accesso (multi-agenzia, fase 1).
 *
 * Dopo il login il browser riceve un cookie che contiene chi sei (id, nome,
 * ruolo, agenzia) più una FIRMA calcolata con una chiave segreta che conosce
 * solo il server. Se qualcuno prova a modificare il cookie (es. cambiarsi il
 * ruolo in MASTER), la firma non torna più e il cookie viene rifiutato.
 *
 * Chiave segreta: variabile d'ambiente AUTH_SECRET su Vercel; se non c'è si
 * usa ADMIN_PASSWORD (già presente), così non serve configurare nulla di nuovo.
 * Cambiare una delle due fa uscire tutti (dovranno rifare il login).
 *
 * Usa solo Web Crypto (crypto.subtle) perché questo file è importato anche da
 * middleware.ts, che su Vercel gira in Edge Runtime (dove il modulo 'crypto'
 * di Node non esiste). L'hash delle password è invece in lib/password.ts.
 */

export const COOKIE_NAME = 'simulotto_sessione';
export const DURATA_SESSIONE_SECONDI = 60 * 60 * 24 * 30; // 30 giorni

export type Ruolo = 'MASTER' | 'TITOLARE' | 'CONSULENTE';

export type Sessione = {
  id: string; // id utente
  nome: string;
  ruolo: Ruolo;
  agenziaId: string | null;
  scade: number; // timestamp in secondi
};

function segreto(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function segretoConfigurato(): boolean {
  return segreto().length > 0;
}

function base64UrlDaTesto(testo: string): string {
  const bytes = new TextEncoder().encode(testo);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function testoDaBase64Url(b64: string): string {
  const normale = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(normale + '==='.slice((normale.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function firma(messaggio: string): Promise<string> {
  const enc = new TextEncoder();
  const chiave = await crypto.subtle.importKey(
    'raw',
    enc.encode(segreto()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', chiave, enc.encode(messaggio));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function ugualiTempoCostante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function creaToken(dati: Omit<Sessione, 'scade'>): Promise<string> {
  const sessione: Sessione = { ...dati, scade: Math.floor(Date.now() / 1000) + DURATA_SESSIONE_SECONDI };
  const corpo = base64UrlDaTesto(JSON.stringify(sessione));
  return `${corpo}.${await firma(corpo)}`;
}

/** Restituisce la sessione se il cookie è valido, firmato e non scaduto; altrimenti null. */
export async function leggiToken(token: string | undefined | null): Promise<Sessione | null> {
  if (!token || !segretoConfigurato()) return null;
  const [corpo, sig] = token.split('.');
  if (!corpo || !sig) return null;
  if (!ugualiTempoCostante(sig, await firma(corpo))) return null;
  try {
    const s = JSON.parse(testoDaBase64Url(corpo)) as Sessione;
    if (!s.id || !s.ruolo || typeof s.scade !== 'number') return null;
    if (s.scade < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export const OPZIONI_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: DURATA_SESSIONE_SECONDI
};
