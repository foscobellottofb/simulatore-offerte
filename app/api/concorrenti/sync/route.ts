import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

// Vedi commento in app/api/pun/sync/route.ts sulla configurazione richiesta.
// A differenza del PUN (dato oggettivo pubblicato da un ente unico), le
// offerte commerciali dei concorrenti sono soggette a interpretazione ed
// errori (pagine promozionali, condizioni nascoste, prezzi scaduti): per
// questo ogni risultato entra con attiva=false e NON compare nella pagina
// pubblica "/mercato" finché qualcuno non lo verifica e attiva a mano.
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Sei un ricercatore che consulta il web per raccogliere offerte pubbliche di
energia elettrica/gas per PICCOLE E MEDIE IMPRESE (mercato libero business, non residenziale, clienti
"non domestici" in bassa tensione).

FONTE PRIORITARIA — usala prima di qualsiasi altra: il Portale Offerte di ARERA/Acquirente Unico
(https://www.ilportaleofferte.it, noto anche come "Trova Offerte" o "portaleofferte.net). È il
comparatore ufficiale dove per legge (delibera ARERA 51/2018/R/com) TUTTI i fornitori devono
pubblicare le proprie offerte, incluse quelle per piccole imprese: è più affidabile di qualsiasi
pagina commerciale di un singolo fornitore. Cerca lì un profilo cliente non domestico rappresentativo
(bassa tensione, potenza 3-6 kW, consumo annuo 2.000-6.000 kWh per la luce; 500-2.000 Smc/anno per il
gas) e riporta le offerte più rilevanti trovate.
Se non riesci ad accedere direttamente al portale (a volte blocca l'accesso automatico), cerca invece
pagine, analisi o comunicati che citino esplicitamente dati presi da lì, oppure — solo come ultima
risorsa e segnalandolo chiaramente in "note" — le pagine ufficiali business dei singoli fornitori
(es. A2A, Iren, Edison, Eni Plenitude, Sorgenia, Acea, Hera Comm): solo offerte chiaramente
pubblicate, mai inventate.

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{
  "offerte": [
    {
      "fornitore": string,
      "nomeOfferta": string,
      "commodity": "LUCE" | "GAS",
      "tipoPrezzo": "FISSO" | "VARIABILE",
      "prezzoKwh": number | null,
      "ccvMensile": number | null,
      "canale": "WEB" | "ALTRO",
      "fonteUrl": string,
      "fontePortaleOfferte": boolean,
      "note": string
    }
  ]
}

Regole:
- "fontePortaleOfferte": true solo se il dato viene davvero dal Portale Offerte ARERA (direttamente o
  da una pagina che lo cita esplicitamente); false se viene dalla pagina di un singolo fornitore.
- "canale": "WEB" se l'offerta è attivabile solo online/autonomamente (spesso con sconto legato
  proprio a questo); "ALTRO" se è un'offerta standard vendibile anche a voce/agenzia.
- "prezzoKwh": prezzo unitario in €/kWh (luce) o €/Smc (gas) della sola componente energia, non il
  totale bolletta. Se l'offerta è variabile, indica lo spread sopra l'indice se esplicitato,
  altrimenti null.
- "note": specifica sempre la data/periodo a cui si riferisce il prezzo trovato, il profilo di
  consumo usato per la ricerca se dal Portale Offerte, e qualunque condizione rilevante (durata
  minima, sconti condizionati, ecc.).
- Massimo 6 offerte, solo quelle con un prezzo esplicito e verificabile. Se non trovi nulla di
  affidabile, restituisci un array vuoto.`;

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: 'Cerca le offerte business luce e gas attualmente pubblicate dai principali fornitori italiani.' }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any
  });

  const testo = message.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n');

  let parsed: {
    offerte: {
      fornitore: string;
      nomeOfferta: string;
      commodity: 'LUCE' | 'GAS';
      tipoPrezzo: string;
      prezzoKwh: number | null;
      ccvMensile: number | null;
      canale: string;
      fonteUrl: string;
      fontePortaleOfferte?: boolean;
      note: string;
    }[];
  };
  try {
    const pulito = testo.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(pulito);
  } catch {
    return NextResponse.json({ error: 'Risposta non interpretabile, riprova.', raw: testo }, { status: 422 });
  }

  const creati = [];
  for (const o of parsed.offerte ?? []) {
    if (!o.fornitore || !o.nomeOfferta) continue;
    const etichettaFonte = o.fontePortaleOfferte ? '✓ Portale Offerte ARERA' : 'fonte diretta fornitore';
    const nuova = await prisma.offertaConcorrente.create({
      data: {
        fornitore: o.fornitore,
        nomeOfferta: o.nomeOfferta,
        commodity: o.commodity === 'GAS' ? 'GAS' : 'LUCE',
        tipoPrezzo: o.tipoPrezzo === 'VARIABILE' ? 'VARIABILE' : 'FISSO',
        prezzoKwh: o.prezzoKwh,
        ccvMensile: o.ccvMensile,
        canale: o.canale === 'WEB' ? 'WEB' : 'ALTRO',
        note: `[Trovata via ricerca web, DA VERIFICARE — ${etichettaFonte}: ${o.fonteUrl || 'n/d'}] ${o.note || ''}`.trim(),
        attiva: false,
        ordinamento: 99
      }
    });
    creati.push(nuova);
  }

  return NextResponse.json({
    ok: true,
    messaggio: `Trovate ${creati.length} offerte, inserite come NON ATTIVE: verificale e attivale da Admin prima che compaiano su /mercato.`,
    creati
  });
}
