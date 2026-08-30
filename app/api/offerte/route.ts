import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Già dinamica di fatto (usa req.nextUrl.searchParams), ma esplicitiamo lo
// stesso per coerenza con le altre route e per sicurezza in caso qualcuno
// tolga in futuro l'uso di searchParams.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const commodity = req.nextUrl.searchParams.get('commodity');
  const offerte = await prisma.offerta.findMany({
    where: {
      attiva: true,
      ...(commodity ? { commodity: commodity as 'LUCE' | 'GAS' } : {})
    },
    orderBy: { nome: 'asc' }
  });
  return NextResponse.json(offerte);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const offerta = await prisma.offerta.create({ data: body });
  return NextResponse.json(offerta, { status: 201 });
}
