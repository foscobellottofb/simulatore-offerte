import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET è pubblico: il simulatore (usato da tutti, senza login) ne ha bisogno
// per calcolare le bollette. La scrittura (PUT) è invece riservata
// all'admin: la protezione è applicata centralmente in middleware.ts.
export async function GET() {
  const fasce = await prisma.fasciaRete.findMany({ orderBy: { ordinamento: 'asc' } });
  return NextResponse.json(fasce);
}

// Aggiornamento in blocco, come /api/parametri: la pagina Admin invia tutte
// le righe modificate insieme.
export async function PUT(req: NextRequest) {
  const body: Array<{ id: string } & Record<string, number>> = await req.json();
  const campiNumerici = [
    'minKw', 'maxKw',
    'distribuzioneFissaAnno', 'distribuzionePotenzaAnno', 'distribuzioneEnergiaKwh',
    'asosFissaAnno', 'asosPotenzaAnno', 'asosEnergiaKwh',
    'arimFissaAnno', 'arimPotenzaAnno', 'arimEnergiaKwh'
  ];
  await Promise.all(
    body.map((f) => {
      const data: Record<string, number> = {};
      for (const campo of campiNumerici) {
        if (f[campo] !== undefined && f[campo] !== null) data[campo] = f[campo];
      }
      return prisma.fasciaRete.update({ where: { id: f.id }, data });
    })
  );
  const fasce = await prisma.fasciaRete.findMany({ orderBy: { ordinamento: 'asc' } });
  return NextResponse.json(fasce);
}
