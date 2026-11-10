import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { richiediUtente } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/** Rinomina, sospende/riattiva un'agenzia o ne aggiorna le note. Solo MASTER.
 *  Sospendere un'agenzia blocca subito l'accesso a tutti i suoi utenti. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await richiediUtente(req, ['MASTER']);
  if (auth.risposta) return auth.risposta;

  const body = await req.json().catch(() => ({}));
  const data: { nome?: string; attiva?: boolean; note?: string | null } = {};
  if (typeof body.nome === 'string' && body.nome.trim()) data.nome = body.nome.trim();
  if (typeof body.attiva === 'boolean') data.attiva = body.attiva;
  if (typeof body.note === 'string') data.note = body.note.trim() || null;

  const esiste = await prisma.agenzia.findUnique({ where: { id: params.id } });
  if (!esiste) return NextResponse.json({ error: 'Agenzia non trovata.' }, { status: 404 });

  const agenzia = await prisma.agenzia.update({ where: { id: params.id }, data });
  return NextResponse.json(agenzia);
}
