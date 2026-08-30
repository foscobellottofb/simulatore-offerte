import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Endpoint PUBBLICO (nessun login) usato dalla pagina "/mercato" (e da
 * "/concorrenza") per far segnalare a chiunque un'offerta concorrente vista
 * in una bolletta reale — la fonte più affidabile che abbiamo, meglio della
 * ricerca web. Per sicurezza, "attiva" è SEMPRE forzata a false qui: chiunque
 * può chiamare questo endpoint (è pubblico apposta), quindi non deve mai
 * poter far comparire direttamente un'offerta su "/mercato" senza revisione
 * da Admin → Concorrenza.
 */
export async function POST(req: NextRequest) {
  const body: {
    fornitore?: string;
    nomeOfferta?: string;
    commodity?: 'LUCE' | 'GAS';
    tipoPrezzo?: string;
    prezzoKwh?: number | null;
    ccvMensile?: number | null;
    sconto?: string | null;
    durataDal?: string | null;
    durataAl?: string | null;
    canale?: string;
    note?: string;
    cteBase64?: string | null;
    nomeSegnalatore?: string;
  } = await req.json();

  if (!body.fornitore || body.prezzoKwh == null) {
    return NextResponse.json({ error: 'Fornitore e prezzo kWh sono obbligatori.' }, { status: 400 });
  }

  const noteComplete = [
    `Segnalata da ${body.nomeSegnalatore || 'utente anonimo'} il ${new Date().toLocaleDateString('it-IT')}, DA VERIFICARE.`,
    body.note || null
  ]
    .filter(Boolean)
    .join(' ');

  const creata = await prisma.offertaConcorrente.create({
    data: {
      fornitore: body.fornitore,
      nomeOfferta: body.nomeOfferta || `Offerta ${body.fornitore}`,
      commodity: body.commodity === 'GAS' ? 'GAS' : 'LUCE',
      tipoPrezzo: body.tipoPrezzo === 'VARIABILE' ? 'VARIABILE' : 'FISSO',
      prezzoKwh: body.prezzoKwh,
      ccvMensile: body.ccvMensile ?? null,
      sconto: body.sconto || null,
      durataDal: body.durataDal || null,
      durataAl: body.durataAl || null,
      canale: body.canale === 'WEB' ? 'WEB' : 'ALTRO',
      note: noteComplete,
      cteBase64: body.cteBase64 || null,
      attiva: false,
      ordinamento: 99
    }
  });

  return NextResponse.json({ ok: true, id: creata.id });
}
