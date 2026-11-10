import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { erroreUsername, errorePassword, hashPassword, normalizzaUsername } from '@/lib/password';
import { CAMPI_UTENTE_PUBBLICI, richiediUtente } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/** Elenco agenzie con i loro utenti + gli utenti master. Solo MASTER. */
export async function GET(req: NextRequest) {
  const auth = await richiediUtente(req, ['MASTER']);
  if (auth.risposta) return auth.risposta;

  const [agenzie, master] = await Promise.all([
    prisma.agenzia.findMany({
      orderBy: { nome: 'asc' },
      include: { utenti: { select: CAMPI_UTENTE_PUBBLICI, orderBy: [{ ruolo: 'asc' }, { nome: 'asc' }] } }
    }),
    prisma.utente.findMany({ where: { ruolo: 'MASTER' }, select: CAMPI_UTENTE_PUBBLICI, orderBy: { nome: 'asc' } })
  ]);
  return NextResponse.json({ agenzie, master });
}

/** Crea una nuova agenzia insieme al suo titolare. Solo MASTER. */
export async function POST(req: NextRequest) {
  const auth = await richiediUtente(req, ['MASTER']);
  if (auth.risposta) return auth.risposta;

  const body = await req.json().catch(() => ({}));
  const nomeAgenzia = typeof body.nome === 'string' ? body.nome.trim() : '';
  const t = body.titolare ?? {};
  const username = normalizzaUsername(t.username);
  const nomeTitolare = typeof t.nome === 'string' ? t.nome.trim() : '';

  const errore =
    (!nomeAgenzia ? "Inserisci il nome dell'agenzia." : null) ||
    (!nomeTitolare ? 'Inserisci il nome del titolare.' : null) ||
    erroreUsername(username) ||
    errorePassword(t.password);
  if (errore) return NextResponse.json({ error: errore }, { status: 400 });

  if (await prisma.utente.findUnique({ where: { username } })) {
    return NextResponse.json({ error: `Il nome utente "${username}" è già in uso.` }, { status: 400 });
  }

  const agenzia = await prisma.agenzia.create({
    data: {
      nome: nomeAgenzia,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
      utenti: {
        create: { username, nome: nomeTitolare, passwordHash: hashPassword(t.password), ruolo: 'TITOLARE' }
      }
    },
    include: { utenti: { select: CAMPI_UTENTE_PUBBLICI } }
  });
  return NextResponse.json(agenzia, { status: 201 });
}
