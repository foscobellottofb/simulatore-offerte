import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { COOKIE_NAME } from '@/lib/auth';
import { utenteDaRichiesta } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/**
 * Chi sono? Usata dal menu laterale a ogni apertura di pagina. Se l'utente o
 * la sua agenzia sono stati disattivati, risponde 401 e cancella il cookie:
 * la disattivazione ha effetto subito, non alla scadenza della sessione.
 * Aggiorna anche "ultimo accesso" (al massimo ogni 10 minuti) per le
 * statistiche d'uso.
 */
export async function GET(req: NextRequest) {
  const io = await utenteDaRichiesta(req);
  if (!io) {
    const res = NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (req.cookies.get(COOKIE_NAME)) res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return res;
  }

  const dieciMinutiFa = new Date(Date.now() - 10 * 60 * 1000);
  await prisma.utente.updateMany({
    where: { id: io.id, OR: [{ ultimoAccesso: null }, { ultimoAccesso: { lt: dieciMinutiFa } }] },
    data: { ultimoAccesso: new Date() }
  });

  return NextResponse.json(io);
}
