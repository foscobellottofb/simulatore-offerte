import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { erroreUsername, errorePassword, hashPassword, normalizzaUsername } from '@/lib/password';
import { CAMPI_UTENTE_PUBBLICI, richiediUtente } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/** Utenti della MIA agenzia. Solo TITOLARE (il master usa /api/agenzie). */
export async function GET(req: NextRequest) {
  const auth = await richiediUtente(req, ['TITOLARE']);
  if (auth.risposta) return auth.risposta;

  const utenti = await prisma.utente.findMany({
    where: { agenziaId: auth.utente.agenziaId },
    select: CAMPI_UTENTE_PUBBLICI,
    orderBy: [{ ruolo: 'asc' }, { nome: 'asc' }]
  });
  return NextResponse.json({ agenzia: auth.utente.agenziaNome, utenti });
}

/**
 * Crea un utente.
 *  - TITOLARE: sempre un CONSULENTE nella propria agenzia.
 *  - MASTER: TITOLARE o CONSULENTE in un'agenzia a scelta (agenziaId).
 */
export async function POST(req: NextRequest) {
  const auth = await richiediUtente(req, ['MASTER', 'TITOLARE']);
  if (auth.risposta) return auth.risposta;
  const io = auth.utente;

  const body = await req.json().catch(() => ({}));
  const username = normalizzaUsername(body.username);
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';

  let ruolo: 'TITOLARE' | 'CONSULENTE' = 'CONSULENTE';
  let agenziaId = io.agenziaId;
  if (io.ruolo === 'MASTER') {
    ruolo = body.ruolo === 'TITOLARE' ? 'TITOLARE' : 'CONSULENTE';
    agenziaId = typeof body.agenziaId === 'string' ? body.agenziaId : null;
    if (!agenziaId || !(await prisma.agenzia.findUnique({ where: { id: agenziaId } }))) {
      return NextResponse.json({ error: 'Agenzia non valida.' }, { status: 400 });
    }
  }

  const errore = (!nome ? 'Inserisci nome e cognome.' : null) || erroreUsername(username) || errorePassword(body.password);
  if (errore) return NextResponse.json({ error: errore }, { status: 400 });

  if (await prisma.utente.findUnique({ where: { username } })) {
    return NextResponse.json({ error: `Il nome utente "${username}" è già in uso.` }, { status: 400 });
  }

  const utente = await prisma.utente.create({
    data: { username, nome, ruolo, agenziaId, passwordHash: hashPassword(body.password) },
    select: CAMPI_UTENTE_PUBBLICI
  });
  return NextResponse.json(utente, { status: 201 });
}
