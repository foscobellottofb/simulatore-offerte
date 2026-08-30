import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PUN_MENSILE_SEED, OFFERTE_CONCORRENTI_SEED } from '@/lib/seedData';

/**
 * Visita /api/seed/mercato?key=LA_TUA_SEED_SECRET per caricare la serie
 * storica del PUN mensile (2024-2026) usata dal grafico della pagina
 * pubblica "/mercato". Non tocca offerte, parametri, fasce di rete o
 * argomentario. Le offerte concorrenti partono vuote (nessuna fonte
 * pubblica affidabile): questo endpoint non le sovrascrive se già presenti.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!process.env.SEED_SECRET || key !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Chiave mancante o errata' }, { status: 401 });
  }

  await prisma.punMensile.deleteMany();
  await prisma.punMensile.createMany({ data: PUN_MENSILE_SEED });

  const concorrentiEsistenti = await prisma.offertaConcorrente.count();
  if (concorrentiEsistenti === 0 && OFFERTE_CONCORRENTI_SEED.length > 0) {
    await prisma.offertaConcorrente.createMany({ data: OFFERTE_CONCORRENTI_SEED });
  }

  const pun = await prisma.punMensile.count();
  const concorrenti = await prisma.offertaConcorrente.count();

  return NextResponse.json({
    ok: true,
    messaggio: `Caricati ${pun} mesi di PUN. Offerte concorrenti presenti: ${concorrenti} (tabella non svuotata se già popolata).`
  });
}
