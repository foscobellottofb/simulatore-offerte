import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Richiede ANTHROPIC_API_KEY (stessa usata per OCR e sincronizzazione PUN).
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Sei un copywriter che scrive script di vendita brevi per consulenti Enel Business,
da usare a voce con un cliente dopo aver confrontato l'offerta Enel con quella attuale del cliente.

Scrivi un discorso naturale (non un elenco puntato, non un'email), in italiano colloquiale ma
professionale — un paragrafo di 80-150 parole che il consulente può leggere quasi alla lettera o
adattare al momento.

Deve toccare questi punti, incorporati nel discorso naturale, non elencati:
1. Il risparmio concreto stimato, se fornito nei dati.
2. Che da oggi il cliente ha un consulente dedicato — parla in prima persona come il consulente
   stesso: non è solo chi vende questa offerta una tantum, ma chi seguirà le sue forniture nel tempo,
   proponendo sempre la soluzione più adatta in base ai consumi reali, disponibile quando serve.
3. Un accenno naturale alla solidità del marchio Enel (grande gruppo affermato, presenza consolidata,
   assistenza affidabile) — breve, non una lista di caratteristiche tecniche.
4. Una chiusura che invita naturalmente a procedere.

Regole:
- Non inventare numeri non forniti nei dati.
- Usa il nome del cliente se fornito, altrimenti resta generico ("lei"/rivolgendoti direttamente).
- Testo semplice, pronto da leggere ad alta voce: niente markdown, niente elenchi puntati, niente
  intestazioni.
- Restituisci SOLO il testo dello script, nessun commento prima o dopo.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const body = await req.json();

  const contesto = `Dati per lo script:
- Cliente: ${body.nomeCliente || 'non specificato'}
- Commodity: ${body.commodity === 'GAS' ? 'gas' : 'energia elettrica'}
- Offerta Enel proposta: ${body.offertaNome || 'non specificata'}
- Fornitore attuale del cliente: ${body.fornitoreConcorrente || 'non specificato'}
- Totale Enel nel periodo: ${body.totaleEnel != null ? body.totaleEnel.toFixed(2) + ' €' : 'non disponibile'}
- Totale concorrente nel periodo: ${body.totaleConcorrente != null ? body.totaleConcorrente.toFixed(2) + ' €' : 'non disponibile'}
- Risparmio annuo stimato: ${body.risparmioAnnuo != null ? body.risparmioAnnuo.toFixed(2) + ' €' : 'non disponibile/non conveniente'}
- Nome del consulente (che parla in prima persona): ${body.nomeConsulente || 'il tuo consulente Enel'}`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contesto }]
    });
  } catch (err: any) {
    console.error('Errore chiamata Anthropic in /api/script-vendita:', err);
    return NextResponse.json(
      { error: `Errore dall'API Anthropic: ${err?.message || 'sconosciuto'} (status ${err?.status ?? 'n/d'})` },
      { status: 502 }
    );
  }

  const textBlock = message.content.find((b) => b.type === 'text');
  const script = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';

  if (!script) {
    return NextResponse.json({ error: 'Nessuno script generato, riprova.' }, { status: 422 });
  }

  return NextResponse.json({ script });
}
