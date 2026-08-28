import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
