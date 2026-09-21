import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET è pubblico: il simulatore (usato da tutti, senza login) ne ha bisogno
// per calcolare le bollette. La scrittura (PUT) è invece riservata
// all'admin: la protezione è applicata centralmente in middleware.ts.
//
// force-dynamic è necessario perché questa GET non legge nulla dalla
// request (niente searchParams/cookies/headers): senza questa direttiva
// Next.js la tratta come route "statica" e ne mette in cache il risultato
// in fase di BUILD, quindi ogni utente vedrebbe per sempre i dati presenti
// nel database al momento del build, ignorando modifiche/seed successivi.
export const dynamic = 'force-dynamic';

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

// Crea una nuova fascia (es. per aggiungere una fascia GAS in futuro, o una
// suddivisione extra oltre a BTA1..BTA6). Valori numerici a 0 di default:
// vanno compilati subito dopo dalla tabella di Admin.
export async function POST(req: NextRequest) {
  const body: { fascia?: string; etichetta?: string; minKw?: number; maxKw?: number | null; commodity?: 'LUCE' | 'GAS' } =
    await req.json();

  if (!body.fascia || !body.fascia.trim()) {
    return NextResponse.json({ error: 'Il codice fascia (es. BTA7) è obbligatorio.' }, { status: 400 });
  }

  const ultimaOrdinamento = await prisma.fasciaRete.aggregate({ _max: { ordinamento: true } });

  const fascia = await prisma.fasciaRete.create({
    data: {
      fascia: body.fascia.trim(),
      etichetta: body.etichetta?.trim() || body.fascia.trim(),
      commodity: body.commodity ?? 'LUCE',
      minKw: body.minKw ?? 0,
      maxKw: body.maxKw ?? null,
      ordinamento: (ultimaOrdinamento._max.ordinamento ?? 0) + 1,
      distribuzioneFissaAnno: 0,
      distribuzionePotenzaAnno: 0,
      distribuzioneEnergiaKwh: 0,
      asosFissaAnno: 0,
      asosPotenzaAnno: 0,
      asosEnergiaKwh: 0,
      arimFissaAnno: 0,
      arimPotenzaAnno: 0,
      arimEnergiaKwh: 0
    }
  });
  return NextResponse.json(fascia, { status: 201 });
}
