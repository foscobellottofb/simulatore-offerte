import { NextRequest, NextResponse } from 'next/server';

// Endpoint DIAGNOSTICO, a costo zero (nessuna chiamata IA, nessun token
// consumato): prova solo a leggere il Portale Offerte ARERA (dati open data
// gratuiti) usando intestazioni realistiche da browser, per capire se il
// sito blocca anche le richieste dal server di Vercel come ha bloccato
// lo strumento di lettura pagine usato in chat. Se funziona, il prossimo
// passo è mappare le colonne reali del CSV trovato.

const HEADERS_BROWSER = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
};

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url: string = body?.url || 'https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page';

  try {
    const res = await fetch(url, { headers: HEADERS_BROWSER });
    const testo = await res.text();

    // Cerca link a file .csv nel testo della pagina, così troviamo il nome
    // aggiornato del file (cambia periodicamente) senza doverlo indovinare.
    const linkCsv = Array.from(testo.matchAll(/href=["']([^"']+\.csv)["']/gi)).map((m) => m[1]);

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      lunghezzaContenuto: testo.length,
      linkCsvTrovati: linkCsv.slice(0, 30),
      anteprimaContenuto: testo.slice(0, 3000)
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, errore: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
