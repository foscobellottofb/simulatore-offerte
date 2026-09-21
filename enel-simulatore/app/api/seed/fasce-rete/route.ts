import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FASCE_RETE_SEED } from '@/lib/seedData';

/**
 * Visita /api/seed/fasce-rete?key=LA_TUA_SEED_SECRET per caricare SOLO le
 * fasce di rete (BTA1..BTA6), senza toccare offerte, parametri o
 * argomentario. Utile per popolare la tabella "Rete e oneri" la prima volta,
 * o per ripristinarla ai valori di partenza (dal file
 * CTE_Enel_SMB_import_SharePoint.xlsx) senza perdere altre modifiche fatte
 * a mano nel resto di Admin.
 *
 * Usa la stessa SEED_SECRET dell'endpoint /api/seed generale.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!process.env.SEED_SECRET || key !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Chiave mancante o errata' }, { status: 401 });
  }

  await prisma.fasciaRete.deleteMany();
  await prisma.fasciaRete.createMany({ data: FASCE_RETE_SEED });

  const fasce = await prisma.fasciaRete.count();
  return NextResponse.json({
    ok: true,
    messaggio: `Caricate ${fasce} fasce di rete (BTA1..BTA6). Offerte, parametri e argomentario non sono stati toccati.`
  });
}
