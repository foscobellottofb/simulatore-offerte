import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { estraiJson } from '@/lib/estraiJson';

// Vedi commento in app/api/pun/sync/route.ts sulla configurazione richiesta.
// A differenza del PUN (dato oggettivo pubblicato da un ente unico), le
// offerte commerciali dei concorrenti sono soggette a interpretazione ed
// errori (pagine promozionali, condizioni nascoste, prezzi scaduti): per
// questo ogni risultato entra con attiva=false e NON compare nella pagina
// pubblica "/mercato" finché qualcuno non lo verifica e attiva a mano.
const anthropic = new Anthropic();

// Elenco fornitori usato per la ricerca "per singolo fornitore": il client
// (Admin) chiama questo endpoint una volta per ciascuno, in sequenza. Ogni
// chiamata è piccola e veloce (un solo fornitore, poche ricerche web), così
// resta comodamente sotto il limite di 10s del piano Vercel Hobby — l'unico
// modo pratico di coprire "tutti i fornitori" restando dentro quel limite.
export const FORNITORI_RICERCA = [
  'A2A', 'Iren', 'Edison', 'Eni Plenitude', 'Sorgenia', 'Acea', 'Hera Comm',
  'Engie', 'Illumia', 'Wekiwi', 'Octopus Energy', 'Green Network', 'NeN', 'Dolomiti Energia'
];

function buildSystemPrompt(fornitore: string | null, webCount: number, fissoCount: number, variabileCount: number) {
  const totaleMax = webCount + fissoCount + variabileCount;

  const regolaCategorie =
    webCount === 0
      ? `- NON includere NESSUNA offerta con canale "WEB" (attivabile solo online) nei risultati, anche se la
  incontri per caso mentre cerchi le altre categorie: scartala. L'utente ha impostato il conteggio "web"
  a 0, quindi quella categoria va del tutto esclusa da questa ricerca.`
      : `- Cerca fino a ${webCount} offerte con canale "WEB" (attivabili solo online), oltre alle altre categorie
  sotto.`;

  const sezioneCopertura = fornitore
    ? `Questa ricerca è limitata a UN SOLO fornitore: "${fornitore}". Cerca sia le sue offerte luce sia gas
(query separate, es. "${fornitore} offerta business luce" e "${fornitore} offerta business gas"). Non
cercare altri fornitori in questa richiesta.`
    : `Copertura: non fermarti al primo risultato. Fai ricerche SEPARATE per ciascuno di questi fornitori
(uno o più per query, sia "nome fornitore offerta business luce" sia "...gas"): ${FORNITORI_RICERCA.join(', ')}.
Includi più fornitori possibile invece di concentrarti solo sui primi 2-3 che trovi, sempre rispettando
i tetti per categoria sopra.`;

  return `Sei un ricercatore che consulta il web per raccogliere offerte pubbliche di
energia elettrica/gas per PICCOLE E MEDIE IMPRESE (mercato libero business, non residenziale, clienti
"non domestici" in bassa tensione).

FONTE PRIORITARIA — usala prima di qualsiasi altra: il Portale Offerte di ARERA/Acquirente Unico
(https://www.ilportaleofferte.it, noto anche come "Trova Offerte" o "portaleofferte.net). È il
comparatore ufficiale dove per legge (delibera ARERA 51/2018/R/com) TUTTI i fornitori devono
pubblicare le proprie offerte, incluse quelle per piccole imprese: è più affidabile di qualsiasi
pagina commerciale di un singolo fornitore. Cerca lì un profilo cliente non domestico rappresentativo
(bassa tensione, potenza 3-6 kW, consumo annuo 2.000-6.000 kWh per la luce; 500-2.000 Smc/anno per il
gas) e riporta le offerte più rilevanti trovate, sia luce che gas.

OBIETTIVI DI RICERCA PER CATEGORIA — l'utente ha configurato quante offerte cercare per ciascuna
categoria; rispetta questi limiti (non superarli, ma è normale trovarne meno se non disponibili):
- Cerca fino a ${fissoCount} offerte a prezzo FISSO (tipoPrezzo="FISSO")${fissoCount === 0 ? ' — se 0, NON cercarne nessuna, scarta qualunque offerta a prezzo fisso incontrata' : ''}.
- Cerca fino a ${variabileCount} offerte a prezzo VARIABILE (tipoPrezzo="VARIABILE")${variabileCount === 0 ? ' — se 0, NON cercarne nessuna, scarta qualunque offerta a prezzo variabile incontrata' : ''}.
${regolaCategorie}
Totale massimo complessivo per questa ricerca: ${totaleMax} offerte.

${sezioneCopertura}
Se il Portale Offerte non è accessibile, cerca invece pagine, analisi o comunicati che ne citino
esplicitamente i dati, oppure — solo come ultima risorsa e segnalandolo chiaramente in "note" — le
pagine ufficiali business del/dei fornitore/i: solo offerte chiaramente pubblicate, mai inventate.

REQUISITO IMPORTANTE — un'offerta è utile solo se è COMPLETA: includila SOLO se riesci a determinare
sia "prezzoKwh" (prezzo unitario materia energia) SIA "ccvMensile" (corrispettivo fisso mensile), con
valori numerici reali, non null. Se una pagina indica solo uno dei due (es. solo il prezzo, senza dire
il CCV, o viceversa), NON includere quell'offerta nei risultati: è meglio restituire meno offerte ma
tutte utilizzabili, piuttosto che offerte con un campo mancante che poi non si possono usare per un
confronto numerico.

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{
  "offerte": [
    {
      "fornitore": string,
      "nomeOfferta": string,
      "commodity": "LUCE" | "GAS",
      "tipoPrezzo": "FISSO" | "VARIABILE",
      "prezzoKwh": number,
      "ccvMensile": number,
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
  totale bolletta. Se l'offerta è variabile, indica lo spread sopra l'indice se esplicitato.
- "note": specifica sempre la data/periodo a cui si riferisce il prezzo trovato, il profilo di
  consumo usato per la ricerca se dal Portale Offerte, e qualunque condizione rilevante (durata
  minima, sconti condizionati, ecc.).
- Se non trovi nessuna offerta completa (prezzo + CCV entrambi presenti), restituisci "offerte": []
  piuttosto che forzare risultati incompleti o inventati.`;
}

// Su piano Vercel Hobby questo valore viene ignorato (limite fisso 10s);
// su Pro/Enterprise consente fino a 60s.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const fornitore: string | null = typeof body?.fornitore === 'string' && body.fornitore.trim() ? body.fornitore.trim() : null;
  const webCount = Math.min(15, Math.max(0, Number(body?.webCount) ?? 0));
  const fissoCount = Math.min(15, Math.max(0, Number(body?.fissoCount) ?? 8));
  const variabileCount = Math.min(15, Math.max(0, Number(body?.variabileCount) ?? 8));

  if (webCount === 0 && fissoCount === 0 && variabileCount === 0) {
    return NextResponse.json(
      { error: 'Tutti i conteggi sono a 0: imposta almeno una categoria (web, prezzo fisso o prezzo variabile) sopra 0 prima di cercare.' },
      { status: 400 }
    );
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: buildSystemPrompt(fornitore, webCount, fissoCount, variabileCount),
    messages: [
      {
        role: 'user',
        content: fornitore
          ? `Cerca le offerte business luce e gas di "${fornitore}", rispettando i tetti per categoria indicati.`
          : 'Cerca le offerte business luce e gas attualmente pubblicate dai principali fornitori italiani, facendo una ricerca per ciascun fornitore elencato nelle istruzioni, rispettando i tetti per categoria indicati.'
      }
    ],
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
    parsed = estraiJson(testo);
  } catch {
    return NextResponse.json({ error: 'Risposta non interpretabile, riprova.', raw: testo }, { status: 422 });
  }

  const creati = [];
  const contatori = { web: 0, fisso: 0, variabile: 0 };
  for (const o of parsed.offerte ?? []) {
    if (!o.fornitore || !o.nomeOfferta) continue;

    // Requisito esplicito richiesto: entrambi i valori devono essere presenti,
    // altrimenti l'offerta non è utilizzabile per un confronto numerico.
    if (o.prezzoKwh == null || o.ccvMensile == null) continue;

    const canale = o.canale === 'WEB' ? 'WEB' : 'ALTRO';
    const tipoPrezzo = o.tipoPrezzo === 'VARIABILE' ? 'VARIABILE' : 'FISSO';

    // Filtro difensivo: rispetta i tetti richiesti anche se l'IA non li ha
    // rispettati perfettamente nel testo (capita, specie con più fornitori).
    if (canale === 'WEB') {
      if (webCount === 0 || contatori.web >= webCount) continue;
      contatori.web++;
    } else if (tipoPrezzo === 'VARIABILE') {
      if (variabileCount === 0 || contatori.variabile >= variabileCount) continue;
      contatori.variabile++;
    } else {
      if (fissoCount === 0 || contatori.fisso >= fissoCount) continue;
      contatori.fisso++;
    }

    const etichettaFonte = o.fontePortaleOfferte ? '✓ Portale Offerte ARERA' : 'fonte diretta fornitore';
    const nuova = await prisma.offertaConcorrente.create({
      data: {
        fornitore: o.fornitore,
        nomeOfferta: o.nomeOfferta,
        commodity: o.commodity === 'GAS' ? 'GAS' : 'LUCE',
        tipoPrezzo,
        prezzoKwh: o.prezzoKwh,
        ccvMensile: o.ccvMensile,
        canale,
        note: `[Trovata via ricerca web, DA VERIFICARE — ${etichettaFonte}: ${o.fonteUrl || 'n/d'}] ${o.note || ''}`.trim(),
        attiva: false,
        ordinamento: 99
      }
    });
    creati.push(nuova);
  }

  return NextResponse.json({
    ok: true,
    messaggio:
      `Trovate ${creati.length} offerte complete (prezzo+CCV) per ${fornitore ?? 'tutti i fornitori'} ` +
      `(web: ${contatori.web}/${webCount}, fisso: ${contatori.fisso}/${fissoCount}, variabile: ${contatori.variabile}/${variabileCount}).`,
    contatori,
    creati
  });
}
