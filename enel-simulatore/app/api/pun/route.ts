import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET pubblica: la pagina "/mercato" e il grafico multi-anno sono visibili a
// tutti, senza login. La scrittura (PUT/POST) è riservata all'admin, protetta
// centralmente in middleware.ts. force-dynamic per lo stesso motivo delle
// altre route di lettura: vedi commento in app/api/fasce-rete/route.ts.
export const dynamic = 'force-dynamic';

export async function GET() {
  const valori = await prisma.punMensile.findMany({ orderBy: [{ anno: 'asc' }, { mese: 'asc' }] });
  return NextResponse.json(valori);
}

// Aggiornamento in blocco, come le altre tabelle di Admin.
export async function PUT(req: NextRequest) {
  const body: Array<{ id: string; valoreMwh: number; stimato?: boolean }> = await req.json();
  await Promise.all(
    body.map((v) =>
      prisma.punMensile.update({
        where: { id: v.id },
        data: { valoreMwh: v.valoreMwh, ...(v.stimato !== undefined ? { stimato: v.stimato } : {}) }
      })
    )
  );
  const valori = await prisma.punMensile.findMany({ orderBy: [{ anno: 'asc' }, { mese: 'asc' }] });
  return NextResponse.json(valori);
}

// Crea/aggiorna un singolo mese (utile per aggiungere il mese corrente
// quando diventa disponibile, senza dover rimandare tutto l'array).
export async function POST(req: NextRequest) {
  const body: { anno: number; mese: number; valoreMwh: number; stimato?: boolean } = await req.json();
  if (!body.anno || !body.mese || body.valoreMwh == null) {
    return NextResponse.json({ error: 'anno, mese e valoreMwh sono obbligatori.' }, { status: 400 });
  }
  const valore = await prisma.punMensile.upsert({
    where: { anno_mese: { anno: body.anno, mese: body.mese } },
    update: { valoreMwh: body.valoreMwh, stimato: body.stimato ?? false },
    create: { anno: body.anno, mese: body.mese, valoreMwh: body.valoreMwh, stimato: body.stimato ?? false }
  });
  return NextResponse.json(valore, { status: 201 });
}
