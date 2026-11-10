import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, leggiToken } from '@/lib/auth';

/**
 * Regole di accesso (multi-agenzia, fase 1).
 *
 * Senza login si possono aprire SOLO:
 *  - /login e /setup (primo accesso / recupero del master)
 *  - /mercato e /aiuto (pagine informative, nessun dato di agenzia)
 *  - le letture di PUN, PSV e offerte concorrenti usate da /mercato
 *  - l'invio di una segnalazione da /mercato (resta da approvare in Admin)
 *  - /api/seed, protetto a parte dalla sua chiave SEED_SECRET
 * Tutto il resto (simulatore, confronto, lettura bolletta AI, PDF…) richiede
 * il login: così solo chi ha un account consuma le chiamate a pagamento.
 *
 * Ruoli:
 *  - /admin/*            → solo MASTER
 *  - /agenzia            → solo TITOLARE (il master usa /admin/agenzie)
 *  - modifiche ai dati comuni (offerte, parametri, PUN, PSV…) → solo MASTER
 * Qui si controlla il cookie firmato; le route più delicate ricontrollano
 * anche sul database che l'utente sia ancora attivo (lib/utenteCorrente.ts).
 */

const PAGINE_PUBBLICHE = ['/login', '/setup', '/mercato', '/aiuto'];
const API_PUBBLICHE = ['/api/auth', '/api/seed'];
const API_LETTURA_PUBBLICA = ['/api/pun', '/api/psv', '/api/concorrenti'];

const PREFIX_SCRITTURA_SOLO_MASTER = [
  '/api/offerte',
  '/api/parametri',
  '/api/fasce-rete',
  '/api/argomenti',
  '/api/direttive',
  '/api/pun',
  '/api/psv',
  '/api/concorrenti'
];

function corrisponde(pathname: string, prefissi: string[]) {
  return prefissi.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Vecchio indirizzo di login dell'Admin → nuovo login unico
  if (pathname === '/admin/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Percorsi pubblici
  if (!isApi && corrisponde(pathname, PAGINE_PUBBLICHE)) return NextResponse.next();
  if (isApi && corrisponde(pathname, API_PUBBLICHE)) return NextResponse.next();
  if (isApi && req.method === 'GET' && corrisponde(pathname, API_LETTURA_PUBBLICA)) return NextResponse.next();
  if (isApi && req.method === 'POST' && pathname === '/api/segnalazioni') return NextResponse.next();

  const sessione = await leggiToken(req.cookies.get(COOKIE_NAME)?.value);

  if (!sessione) {
    if (isApi) {
      return NextResponse.json({ error: 'Accesso riservato: effettua il login.' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const ruolo = sessione.ruolo;

  if (!isApi) {
    if (corrisponde(pathname, ['/admin']) && ruolo !== 'MASTER') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (corrisponde(pathname, ['/agenzia'])) {
      if (ruolo === 'MASTER') return NextResponse.redirect(new URL('/admin/agenzie', req.url));
      if (ruolo !== 'TITOLARE') return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (req.method !== 'GET' && corrisponde(pathname, PREFIX_SCRITTURA_SOLO_MASTER) && ruolo !== 'MASTER') {
    return NextResponse.json({ error: 'Solo l\'amministratore centrale può modificare questi dati.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // Tutto tranne i file statici di Next e i file con estensione (immagini, icone…)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
