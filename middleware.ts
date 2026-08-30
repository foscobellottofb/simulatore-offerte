import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, tokenValido } from '@/lib/auth';

/**
 * Simulatore e Confronto concorrenza (/simulatore, /concorrenza) restano
 * pubblici, così come la lettura (GET) di offerte/parametri/fasce-rete di
 * cui hanno bisogno per calcolare. Quello che viene protetto:
 *  - tutte le pagine sotto /admin (tranne /admin/login)
 *  - le chiamate che scrivono dati (POST/PUT/PATCH/DELETE) verso le tabelle
 *    che si editano da Admin: offerte, parametri, fasce-rete, argomenti.
 * /api/seed resta protetto a parte dalla sua chiave SEED_SECRET (invariato).
 */

const PREFIX_SCRITTURA_PROTETTA = ['/api/offerte', '/api/parametri', '/api/fasce-rete', '/api/argomenti'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const autenticato = await tokenValido(req.cookies.get(COOKIE_NAME)?.value);

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!autenticato) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (
    req.method !== 'GET' &&
    PREFIX_SCRITTURA_PROTETTA.some((p) => pathname.startsWith(p)) &&
    !autenticato
  ) {
    return NextResponse.json({ error: 'Accesso riservato: effettua il login in /admin.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/offerte/:path*', '/api/parametri/:path*', '/api/fasce-rete/:path*', '/api/argomenti/:path*']
};
