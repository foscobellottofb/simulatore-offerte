import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { COOKIE_NAME, OPZIONI_COOKIE, creaToken, segretoConfigurato } from '@/lib/auth';
import { normalizzaUsername, verificaPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

const ERRORE_CREDENZIALI = 'Nome utente o password errati.';

export async function POST(req: NextRequest) {
  if (!segretoConfigurato()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD non è impostata su Vercel: aggiungila nelle variabili d'ambiente del progetto." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const username = normalizzaUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';

  const u = username ? await prisma.utente.findUnique({ where: { username }, include: { agenzia: true } }) : null;

  if (!u || !verificaPassword(password, u.passwordHash)) {
    // Piccola attesa: rende più lenti i tentativi a raffica di indovinare la password
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: ERRORE_CREDENZIALI }, { status: 401 });
  }
  if (!u.attivo) {
    return NextResponse.json({ error: 'Account disattivato: contatta il titolare della tua agenzia.' }, { status: 403 });
  }
  if (u.ruolo !== 'MASTER' && (!u.agenzia || !u.agenzia.attiva)) {
    return NextResponse.json({ error: 'La tua agenzia è sospesa: contatta l\'amministratore.' }, { status: 403 });
  }

  await prisma.utente.update({
    where: { id: u.id },
    data: { ultimoAccesso: new Date(), numeroAccessi: { increment: 1 } }
  });

  const res = NextResponse.json({ ok: true, ruolo: u.ruolo });
  res.cookies.set(
    COOKIE_NAME,
    await creaToken({ id: u.id, nome: u.nome, ruolo: u.ruolo, agenziaId: u.agenziaId }),
    OPZIONI_COOKIE
  );
  return res;
}
