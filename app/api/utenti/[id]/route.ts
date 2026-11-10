import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorePassword, hashPassword } from '@/lib/password';
import { CAMPI_UTENTE_PUBBLICI, richiediUtente } from '@/lib/utenteCorrente';

export const dynamic = 'force-dynamic';

/**
 * Modifica un utente: nome, attivo/disattivo, nuova password, ruolo.
 *  - MASTER: qualsiasi titolare o consulente (anche il ruolo).
 *  - TITOLARE: solo i consulenti della propria agenzia (non il ruolo).
 * Nessuno modifica sé stesso da qui (la propria password si cambia dal
 * profilo): così non ci si può chiudere fuori per sbaglio.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await richiediUtente(req, ['MASTER', 'TITOLARE']);
  if (auth.risposta) return auth.risposta;
  const io = auth.utente;

  const target = await prisma.utente.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
  if (target.id === io.id) {
    return NextResponse.json({ error: 'Per modificare il tuo account usa "Il mio profilo".' }, { status: 400 });
  }
  if (target.ruolo === 'MASTER') {
    return NextResponse.json({ error: 'Gli utenti master si gestiscono dalla pagina di setup.' }, { status: 403 });
  }
  if (io.ruolo === 'TITOLARE' && (target.agenziaId !== io.agenziaId || target.ruolo !== 'CONSULENTE')) {
    return NextResponse.json({ error: 'Puoi gestire solo i consulenti della tua agenzia.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { nome?: string; attivo?: boolean; passwordHash?: string; ruolo?: 'TITOLARE' | 'CONSULENTE' } = {};
  if (typeof body.nome === 'string' && body.nome.trim()) data.nome = body.nome.trim();
  if (typeof body.attivo === 'boolean') data.attivo = body.attivo;
  if (body.password !== undefined) {
    const errore = errorePassword(body.password);
    if (errore) return NextResponse.json({ error: errore }, { status: 400 });
    data.passwordHash = hashPassword(body.password);
  }
  if (io.ruolo === 'MASTER' && (body.ruolo === 'TITOLARE' || body.ruolo === 'CONSULENTE')) data.ruolo = body.ruolo;

  const utente = await prisma.utente.update({ where: { id: target.id }, data, select: CAMPI_UTENTE_PUBBLICI });
  return NextResponse.json(utente);
}
