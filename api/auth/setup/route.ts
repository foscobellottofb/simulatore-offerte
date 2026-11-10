import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { COOKIE_NAME, OPZIONI_COOKIE, creaToken } from '@/lib/auth';
import { erroreUsername, errorePassword, hashPassword, normalizzaUsername } from '@/lib/password';

export const dynamic = 'force-dynamic';

/**
 * Primo accesso del MASTER e recupero se dimentica la password.
 * Protetto da una delle due chiavi impostate su Vercel, che conosce solo il
 * proprietario dell'app: ADMIN_PASSWORD (la vecchia password dell'Admin)
 * oppure SEED_SECRET (la chiave usata per /api/seed).
 *  - se il nome utente non esiste → crea un nuovo utente MASTER
 *  - se esiste ed è MASTER → gli reimposta nome e password
 *  - se esiste ma è titolare/consulente → errore (non si promuove così)
 */
export async function POST(req: NextRequest) {
  const chiaviValide = [process.env.ADMIN_PASSWORD, process.env.SEED_SECRET].filter(
    (c): c is string => typeof c === 'string' && c.length > 0
  );
  if (chiaviValide.length === 0) {
    return NextResponse.json(
      { error: "Né ADMIN_PASSWORD né SEED_SECRET sono impostate su Vercel: aggiungine una nelle variabili d'ambiente." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const inserita = typeof body.chiave === 'string' ? body.chiave.trim() : '';
  if (!chiaviValide.includes(inserita)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Chiave di installazione errata.' }, { status: 401 });
  }

  const username = normalizzaUsername(body.username);
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const errore = erroreUsername(username) || errorePassword(body.password) || (!nome ? 'Inserisci il tuo nome.' : null);
  if (errore) return NextResponse.json({ error: errore }, { status: 400 });

  const esistente = await prisma.utente.findUnique({ where: { username } });
  if (esistente && esistente.ruolo !== 'MASTER') {
    return NextResponse.json(
      { error: 'Questo nome utente appartiene già a un titolare o consulente: scegline un altro.' },
      { status: 400 }
    );
  }

  const passwordHash = hashPassword(body.password);
  const master = esistente
    ? await prisma.utente.update({ where: { id: esistente.id }, data: { nome, passwordHash, attivo: true } })
    : await prisma.utente.create({ data: { username, nome, passwordHash, ruolo: 'MASTER' } });

  await prisma.utente.update({
    where: { id: master.id },
    data: { ultimoAccesso: new Date(), numeroAccessi: { increment: 1 } }
  });

  const res = NextResponse.json({ ok: true, creato: !esistente });
  res.cookies.set(
    COOKIE_NAME,
    await creaToken({ id: master.id, nome: master.nome, ruolo: 'MASTER', agenziaId: null }),
    OPZIONI_COOKIE
  );
  return res;
}
