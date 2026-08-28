import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OFFERTE_SEED, PARAMETRI_SEED } from '@/lib/seedData';

/**
 * Visita https://tuo-progetto.vercel.app/api/seed?key=LA_TUA_CHIAVE nel browser
 * per popolare il database la prima volta (o per ripristinare i dati di partenza).
 * La chiave va impostata come variabile d'ambiente SEED_SECRET su Vercel, così
 * nessun altro può richiamare questo endpoint a caso.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!process.env.SEED_SECRET || key !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Chiave mancante o errata' }, { status: 401 });
  }

  await prisma.offerta.deleteMany();
  await prisma.parametroDettaglio.deleteMany();
  await prisma.offerta.createMany({ data: OFFERTE_SEED });
  await prisma.parametroDettaglio.createMany({ data: PARAMETRI_SEED });

  const offerte = await prisma.offerta.count();
  const parametri = await prisma.parametroDettaglio.count();

  return NextResponse.json({
    ok: true,
    messaggio: `Caricate ${offerte} offerte e ${parametri} parametri di dettaglio.`
  });
}
