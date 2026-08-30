import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET pubblica: mostrata nella pagina "/mercato" per dare contesto sulle
// offerte concorrenti. Di default mostra solo quelle attive (verificate) E
// non scadute: se "durataAl" è nel passato, l'offerta smette di comparire da
// sola, senza bisogno che qualcuno la disattivi a mano.
// La pagina Admin passa ?includiInattive=1 per vedere anche le bozze non
// ancora confermate e quelle scadute (utile per rinnovarle o eliminarle),
// da attivare/aggiornare a mano dopo averle controllate. Scrittura riservata
// all'admin (middleware.ts).
export async function GET(req: NextRequest) {
  const includiInattive = req.nextUrl.searchParams.get('includiInattive') === '1';
  const oggi = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", confrontabile come stringa

  const offerte = await prisma.offertaConcorrente.findMany({
    where: includiInattive
      ? {}
      : {
          attiva: true,
          OR: [{ durataAl: null }, { durataAl: '' }, { durataAl: { gte: oggi } }]
        },
    orderBy: [{ ordinamento: 'asc' }, { fornitore: 'asc' }]
  });
  return NextResponse.json(offerte);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const offerta = await prisma.offertaConcorrente.create({ data: body });
  return NextResponse.json(offerta, { status: 201 });
}
