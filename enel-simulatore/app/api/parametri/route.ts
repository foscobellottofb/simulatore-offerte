import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Vedi commento in app/api/fasce-rete/route.ts: senza questa direttiva
// Next.js metterebbe in cache il risultato di questa GET al momento del
// build, ignorando modifiche fatte da Admin dopo il deploy.
export const dynamic = 'force-dynamic';

export async function GET() {
  const parametri = await prisma.parametroDettaglio.findMany({ orderBy: { ordinamento: 'asc' } });
  return NextResponse.json(parametri);
}

// Aggiornamento in blocco (usato dalla pagina Admin: salva tutte le righe modificate)
export async function PUT(req: NextRequest) {
  const body: { id: string; valore: number }[] = await req.json();
  await Promise.all(
    body.map((p) => prisma.parametroDettaglio.update({ where: { id: p.id }, data: { valore: p.valore } }))
  );
  const parametri = await prisma.parametroDettaglio.findMany({ orderBy: { ordinamento: 'asc' } });
  return NextResponse.json(parametri);
}
