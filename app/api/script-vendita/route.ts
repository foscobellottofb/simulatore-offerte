import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

// Richiede ANTHROPIC_API_KEY (stessa usata per OCR e sincronizzazione PUN).
const anthropic = new Anthropic();

// Regole STRUTTURALI, fisse (formato/tono/lunghezza): non sono "cosa dire"
// ma "come dirlo", quindi restano nel codice invece che tra le direttive
// editabili da Admin (quelle sono per il CONTENUTO, vedi sotto).
const REGOLE_STRUTTURALI = `Sei un copywriter che scrive script di vendita brevi per consulenti Enel Business,
da usare a voce con un cliente dopo aver confrontato l'offerta Enel con quella attuale del cliente.

Scrivi un discorso naturale (non un elenco puntato, non un'email), in italiano colloquiale ma
professionale — un paragrafo di 80-150 parole che il consulente può leggere quasi alla lettera o
adattare al momento.

Varietà: ogni volta che generi uno script, anche con dati di contesto simili, deve suonare diverso
dalle volte precedenti — cambia la frase di apertura, l'ordine in cui presenti i concetti, le parole
usate per esprimere ciascun punto, il ritmo delle frasi. Non ripetere sempre la stessa struttura o le
stesse espressioni fisse (es. non aprire sempre con "Le volevo parlare di..." o chiudere sempre allo
stesso modo): il consulente lo userà più volte con clienti diversi e non deve sembrare un copione
riciclato.

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

  // Direttive di CONTENUTO, editabili da Admin → "Caracozzo AI": cosa deve
  // toccare lo script (es. "presentati come consulente dedicato"), non come
  // scriverlo (quello resta fisso in REGOLE_STRUTTURALI sopra).
  const direttiveAttive = await prisma.direttivaScript.findMany({
    where: { attiva: true },
    orderBy: { ordinamento: 'asc' }
  });

  const sezioneDirettive =
    direttiveAttive.length > 0
      ? `Deve toccare questi punti, incorporati nel discorso naturale, non elencati come una lista:\n` +
        direttiveAttive.map((d, i) => `${i + 1}. ${d.testo}`).join('\n')
      : 'Non ci sono direttive di contenuto specifiche configurate: scrivi uno script di vendita generico, professionale e naturale, basandoti sui dati forniti sotto.';

  const registro = REGISTRI[Math.floor(Math.random() * REGISTRI.length)];

  // Contesto: tutti i dati disponibili della pagina "Confronto concorrenza"
  // che possono aiutare l'IA a scrivere uno script più mirato — non solo i
  // pochi campi minimi di prima, così può usarli se rilevanti (es. zona,
  // indirizzo, dati del profilo di consumo, eventuali costi extra rilevati).
  const righeContesto = [
    `Cliente: ${body.nomeCliente || 'non specificato'}`,
    `Commodity: ${body.commodity === 'GAS' ? 'gas' : 'energia elettrica'}`,
    body.zonaGas ? `Zona tariffaria gas: ${body.zonaGas}` : null,
    body.citta ? `Città fornitura: ${body.citta}` : null,
    body.consumoKwh != null ? `Consumo: ${body.consumoKwh} ${body.commodity === 'GAS' ? 'Smc' : 'kWh'}` : null,
    body.giorniFattura != null ? `Periodo: ${body.giorniFattura} giorni` : null,
    `Offerta Enel proposta: ${body.offertaNome || 'non specificata'}`,
    `Fornitore attuale del cliente: ${body.fornitoreConcorrente || 'non specificato'}`,
    body.tipoPrezzoConcorrente ? `Tipo prezzo concorrente: ${body.tipoPrezzoConcorrente === 'VARIABILE' ? 'variabile' : 'fisso'}` : null,
    `Totale Enel nel periodo: ${body.totaleEnel != null ? body.totaleEnel.toFixed(2) + ' €' : 'non disponibile'}`,
    `Totale concorrente nel periodo: ${body.totaleConcorrente != null ? body.totaleConcorrente.toFixed(2) + ' €' : 'non disponibile'}`,
    `Risparmio annuo stimato: ${body.risparmioAnnuo != null ? body.risparmioAnnuo.toFixed(2) + ' €' : 'non disponibile/non conveniente'}`,
    body.risparmioAnnuo != null && body.risparmioAnnuo < 0
      ? 'ATTENZIONE: in questo caso Enel NON è la soluzione più economica per questo cliente — tienine conto nello script, seguendo le direttive sopra su come gestire questo scenario.'
      : null,
    body.costiExtraRilevati ? `Costi extra rilevati in bolletta concorrente: ${body.costiExtraRilevati}` : null,
    `Nome del consulente (che parla in prima persona): ${body.nomeConsulente || 'il tuo consulente Enel'}`
  ]
    .filter(Boolean)
    .join('\n- ');

  const contesto = `Dati per lo script:\n- ${righeContesto}\n\nPer questa generazione, usa un registro comunicativo ${registro}.`;

  const systemPrompt = `${REGOLE_STRUTTURALI}\n\n${sezioneDirettive}`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 1,
      system: systemPrompt,
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
