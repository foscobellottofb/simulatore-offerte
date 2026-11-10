import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorePassword, hashPassword, verificaPassword } from '@/lib/password';
import { richiediUtente } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/** Ogni utente cambia la propria password (serve quella attuale). */
export async function POST(req: NextRequest) {
  const auth = await richiediUtente(req);
  if (auth.risposta) return auth.risposta;

  const body = await req.json().catch(() => ({}));
  const errore = errorePassword(body.nuova);
  if (errore) return NextResponse.json({ error: errore }, { status: 400 });

  const u = await prisma.utente.findUnique({ where: { id: auth.utente.id } });
  if (!u || typeof body.attuale !== 'string' || !verificaPassword(body.attuale, u.passwordHash)) {
    return NextResponse.json({ error: 'La password attuale non è corretta.' }, { status: 400 });
  }

  await prisma.utente.update({ where: { id: u.id }, data: { passwordHash: hashPassword(body.nuova) } });
  return NextResponse.json({ ok: true });
}
