import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET pubblica: mostrata nella pagina "/mercato" per dare contesto sulle
// offerte concorrenti. Scrittura riservata all'admin (middleware.ts).
export async function GET() {
  const offerte = await prisma.offertaConcorrente.findMany({
    where: { attiva: true },
    orderBy: [{ ordinamento: 'asc' }, { fornitore: 'asc' }]
  });
  return NextResponse.json(offerte);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const offerta = await prisma.offertaConcorrente.create({ data: body });
  return NextResponse.json(offerta, { status: 201 });
}
