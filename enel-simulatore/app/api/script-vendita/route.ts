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
2. OBBLIGATORIO, non ometterlo mai in nessuna generazione: che da oggi il cliente ha un consulente
   dedicato — parla in prima persona come il consulente stesso. Non è solo chi vende questa offerta
   una tantum, ma chi seguirà le sue forniture nel tempo, proponendo sempre la soluzione più adatta in
   base ai consumi reali, disponibile quando serve. Anche se varii tutto il resto dello script, questo
   punto ci deve sempre essere, in qualche forma.
3. Un accenno naturale alla solidità del marchio Enel (grande gruppo affermato, presenza consolidata,
   assistenza affidabile) — breve, non una lista di caratteristiche tecniche.
4. Una chiusura che invita naturalmente a procedere.

Varietà: ogni volta che generi uno script, anche con dati di contesto simili, deve suonare diverso
dalle volte precedenti — cambia la frase di apertura, l'ordine in cui presenti i concetti, le parole
usate per esprimere ciascun punto, il ritmo delle frasi. Non ripetere sempre la stessa struttura o le
stesse espressioni fisse (es. non aprire sempre con "Le volevo parlare di..." o chiudere sempre allo
stesso modo): il consulente lo userà più volte con clienti diversi e non deve sembrare un copione
riciclato. I quattro punti sopra restano fissi nel contenuto, ma il modo di dirli deve variare.

Regole:
- Non inventare numeri non forniti nei dati.
- Usa il nome del cliente se fornito, altrimenti resta generico ("lei"/rivolgendoti direttamente).
- Testo semplice, pronto da leggere ad alta voce: niente markdown, niente elenchi puntati, niente
  intestazioni.
- Restituisci SOLO il testo dello script, nessun commento prima o dopo.`;

// Piccoli spunti di registro comunicativo, scelti a caso ad ogni chiamata:
// aiutano il modello a partire da un tono diverso invece di convergere
// sempre sulla stessa formulazione "media".
const REGISTRI = [
  'diretto e concreto, va dritto al punto sul risparmio',
  'caloroso ed empatico, mette a suo agio il cliente prima di parlare di numeri',
  'entusiasta ma misurato, trasmette energia senza esagerare',
  'rassicurante, insiste sulla continuità e la tranquillità del passaggio',
  'consulenziale, si presenta come chi ha già pensato alla soluzione giusta per lui'
];

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const body = await req.json();

  const registro = REGISTRI[Math.floor(Math.random() * REGISTRI.length)];

  const contesto = `Dati per lo script:
- Cliente: ${body.nomeCliente || 'non specificato'}
- Commodity: ${body.commodity === 'GAS' ? 'gas' : 'energia elettrica'}
- Offerta Enel proposta: ${body.offertaNome || 'non specificata'}
- Fornitore attuale del cliente: ${body.fornitoreConcorrente || 'non specificato'}
- Totale Enel nel periodo: ${body.totaleEnel != null ? body.totaleEnel.toFixed(2) + ' €' : 'non disponibile'}
- Totale concorrente nel periodo: ${body.totaleConcorrente != null ? body.totaleConcorrente.toFixed(2) + ' €' : 'non disponibile'}
- Risparmio annuo stimato: ${body.risparmioAnnuo != null ? body.risparmioAnnuo.toFixed(2) + ' €' : 'non disponibile/non conveniente'}
- Nome del consulente (che parla in prima persona): ${body.nomeConsulente || 'il tuo consulente Enel'}

Per questa generazione, usa un registro comunicativo ${registro}.`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 1,
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
