import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { COOKIE_NAME, leggiToken, Ruolo } from '@/lib/auth';

/**
 * Chi sta facendo la richiesta, verificato sul DATABASE (non solo sul cookie):
 * se nel frattempo l'utente o la sua agenzia sono stati disattivati, qui
 * risulta "non autenticato" anche se il cookie è ancora valido.
 * Solo lato server (route API), non importare da middleware.ts.
 */

export type UtenteCorrente = {
  id: string;
  username: string;
  nome: string;
  ruolo: Ruolo;
  agenziaId: string | null;
  agenziaNome: string | null;
};

export async function utenteDaRichiesta(req: NextRequest): Promise<UtenteCorrente | null> {
  const s = await leggiToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!s) return null;
  const u = await prisma.utente.findUnique({ where: { id: s.id }, include: { agenzia: true } });
  if (!u || !u.attivo) return null;
  if (u.ruolo !== 'MASTER' && (!u.agenzia || !u.agenzia.attiva)) return null;
  return {
    id: u.id,
    username: u.username,
    nome: u.nome,
    ruolo: u.ruolo,
    agenziaId: u.agenziaId,
    agenziaNome: u.agenzia?.nome ?? null
  };
}

type Esito = { utente: UtenteCorrente; risposta?: undefined } | { utente?: undefined; risposta: NextResponse };

/**
 * Uso nelle route:
 *   const auth = await richiediUtente(req, ['MASTER']);
 *   if (auth.risposta) return auth.risposta;
 *   const io = auth.utente;
 */
export async function richiediUtente(req: NextRequest, ruoli?: Ruolo[]): Promise<Esito> {
  const utente = await utenteDaRichiesta(req);
  if (!utente) {
    return { risposta: NextResponse.json({ error: 'Sessione scaduta o account disattivato: rifai il login.' }, { status: 401 }) };
  }
  if (ruoli && !ruoli.includes(utente.ruolo)) {
    return { risposta: NextResponse.json({ error: 'Non hai i permessi per questa operazione.' }, { status: 403 }) };
  }
  return { utente };
}

/** Campi di un utente che si possono mostrare (mai l'hash della password). */
export const CAMPI_UTENTE_PUBBLICI = {
  id: true,
  username: true,
  nome: true,
  ruolo: true,
  agenziaId: true,
  attivo: true,
  ultimoAccesso: true,
  numeroAccessi: true,
  createdAt: true
} as const;
