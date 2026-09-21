import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Richiede la variabile d'ambiente ANTHROPIC_API_KEY (Vercel -> Project Settings -> Environment Variables).
const anthropic = new Anthropic();

// Un PDF di più pagine può richiedere più tempo di analisi. Su Vercel Hobby
// il limite massimo è comunque fisso a 10s (questo valore viene ignorato);
// su Pro/Enterprise consente fino a 60s, utile per bollette lunghe.
export const maxDuration = 60;

const SYSTEM_PROMPT = `Sei un analista che legge bollette di energia elettrica e gas italiane di
fornitori concorrenti (una o più foto delle pagine della bolletta, oppure un PDF multipagina) per
aiutare un consulente commerciale Enel a confrontarle correttamente con le proprie offerte. Se ricevi
più immagini, sono le pagine della STESSA bolletta nell'ordine in cui te le passo: leggile come un
unico documento, non come bollette separate.

Devi restituire SOLO un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:

{
  "prezzoKwhLuce": number | null,
  "prezzoKwhGas": number | null,
  "ccvMensile": number | null,
  "totaleBolletta": number | null,
  "fornitore": string | null,
  "consumoKwh": number | null,
  "potenzaKw": number | null,
  "giorniFattura": number | null,
  "nomeCliente": string | null,
  "pod": string | null,
  "indirizzoFornitura": string | null,
  "citta": string | null,
  "codiceFiscalePiva": string | null,
  "confidenza": "alta" | "media" | "bassa",
  "note": string | null,
  "costiExtra": [
    { "descrizione": string, "importo": number | null, "tipo": "una_tantum" | "ricorrente_extra" }
  ],
  "analisi": string
}

Regole:
- "prezzoKwhLuce"/"prezzoKwhGas": il prezzo unitario della SOLA materia energia in €/kWh (o €/Smc per
  il gas) — quello che il fornitore applica per l'offerta, NON un totale in euro. Se ci sono più fasce
  orarie, usa il prezzo medio/monorario se disponibile, altrimenti il valore più rappresentativo e
  spiegalo in "note".
- "ccvMensile": il corrispettivo fisso di commercializzazione/vendita mensile in euro, se presente.
- "totaleBolletta": il totale da pagare indicato in bolletta, se leggibile.
- "consumoKwh": il consumo del periodo fatturato in kWh (elettricità) o Smc (gas) — quello effettivamente
  fatturato in questa bolletta, non un consumo annuo stimato. Se ci sono più fasce (F1/F2/F3), usa il
  totale complessivo del periodo.
- "potenzaKw": la potenza impegnata/disponibile del punto di fornitura in kW, solo per elettricità
  (spesso indicata come "Potenza impegnata" o "Potenza disponibile"). Null per il gas.
- "giorniFattura": il numero di giorni del periodo fatturato, se calcolabile dalle date di inizio/fine
  periodo indicate in bolletta (es. dal 01/06 al 31/07 = 61 giorni). Se non è chiaro, usa null piuttosto
  che stimarlo.
- "nomeCliente": l'intestatario della bolletta (persona o ragione sociale), se presente.
- "pod": il codice POD (elettricità, formato IT+numeri) o PDR (gas) del punto di fornitura, se presente.
- "indirizzoFornitura": via e numero civico del punto di fornitura, se presente (separato dalla città).
- "citta": CAP e città/comune del punto di fornitura, se presente.
- "codiceFiscalePiva": codice fiscale o partita IVA dell'intestatario, se presente.
- "costiExtra": voci che NON sono la normale spesa energia/rete/oneri/accisa/IVA del periodo — es.
  interessi di mora, spese di sollecito o riscossione, canoni di noleggio contatore, contributi una
  tantum, rate di importi arretrati, bolli. "tipo" è "una_tantum" per addebiti isolati legati a un
  evento (mora, sollecito, riscossione), "ricorrente_extra" per costi fissi ricorrenti oltre al CCV
  standard (es. un canone aggiuntivo mensile). NON includere qui le normali componenti di rete/oneri di
  sistema/accisa/IVA, quelle fanno parte del costo normale dell'energia, non sono "extra". Se non ce ne
  sono, restituisci un array vuoto.
- "analisi": 2-4 frasi in italiano semplice, in linguaggio da consulente-a-consulente: qual è il vero
  costo dell'energia per questo cliente, se il totale in bolletta è gonfiato da costi una tantum (in tal
  caso specifica quanto, e che quindi il confronto con un'offerta nuova non deve includerli), e qualunque
  altra cosa un consulente dovrebbe sapere prima di usare questi dati per un confronto. Se non trovi
  nulla di rilevante oltre ai dati base, dillo esplicitamente ("Nessun costo extra rilevato oltre alla
  normale struttura tariffaria.").
- Se un valore non è leggibile o non è presente, usa null. Non inventare numeri né dati anagrafici.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  // Il caricamento file (chiamata a pagamento) è riservato agli operatori
  // abilitati. Il controllo lato client è solo comodità: quello che conta è
  // questo, lato server, altrimenti chiunque potrebbe chiamare l'endpoint
  // direttamente bypassando l'interfaccia.
  if (!process.env.OPERATOR_PASSWORD) {
    return NextResponse.json(
      { error: 'OPERATOR_PASSWORD non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }
  if (req.headers.get('x-operator-key') !== process.env.OPERATOR_PASSWORD) {
    return NextResponse.json({ error: 'Password operatore errata o mancante.' }, { status: 401 });
  }

  const body = await req.json();
  // "pagine" è il formato nuovo (una o più foto/PDF), con fallback al vecchio
  // formato a singolo file per non rompere eventuali chiamate già in volo.
  const pagine: { data: string; mediaType: string }[] = Array.isArray(body.pagine)
    ? body.pagine
    : body.imageBase64
      ? [{ data: body.imageBase64, mediaType: body.mediaType }]
      : [];

  if (pagine.length === 0) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }

  let message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...pagine.map(
              (p) =>
                (p.mediaType === 'application/pdf'
                  ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: p.data } }
                  : { type: 'image', source: { type: 'base64', media_type: p.mediaType || 'image/jpeg', data: p.data } }) as any
            ),
            {
              type: 'text',
              text:
                pagine.length > 1
                  ? `Analizza queste ${pagine.length} pagine della stessa bolletta secondo le istruzioni, includendo eventuali costi extra.`
                  : 'Analizza questa bolletta secondo le istruzioni, includendo eventuali costi extra.'
            }
          ]
        }
      ]
    });
  } catch (err: any) {
    // Mostriamo il vero motivo (chiave non valida, credito esaurito, file
    // non supportato, ecc.) invece di un 500 generico senza dettagli.
    console.error('Errore chiamata Anthropic in /api/ocr:', err);
    return NextResponse.json(
      { error: `Errore dall'API Anthropic: ${err?.message || 'sconosciuto'} (status ${err?.status ?? 'n/d'})` },
      { status: 502 }
    );
  }

  const textBlock = message.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: 'Estrazione non riuscita, inserisci i dati a mano', raw }, { status: 422 });
  }
}
