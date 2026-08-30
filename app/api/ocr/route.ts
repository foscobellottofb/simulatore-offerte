import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Richiede la variabile d'ambiente ANTHROPIC_API_KEY (Vercel -> Project Settings -> Environment Variables).
const anthropic = new Anthropic();

// Un PDF di più pagine può richiedere più tempo di analisi. Su Vercel Hobby
// il limite massimo è comunque fisso a 10s (questo valore viene ignorato);
// su Pro/Enterprise consente fino a 60s, utile per bollette lunghe.
export const maxDuration = 60;

const SYSTEM_PROMPT = `Sei un analista che legge bollette di energia elettrica e gas italiane di
fornitori concorrenti (foto o PDF, anche multipagina) per aiutare un consulente commerciale Enel a
confrontarle correttamente con le proprie offerte.

Devi restituire SOLO un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:

{
  "prezzoKwhLuce": number | null,
  "prezzoKwhGas": number | null,
  "ccvMensile": number | null,
  "totaleBolletta": number | null,
  "fornitore": string | null,
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
- Se un valore non è leggibile o non è presente, usa null. Non inventare numeri.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const { imageBase64, mediaType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }

  const isPdf = mediaType === 'application/pdf';

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
            (isPdf
              ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
              : { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } }) as any,
            { type: 'text', text: 'Analizza questa bolletta secondo le istruzioni, includendo eventuali costi extra.' }
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
