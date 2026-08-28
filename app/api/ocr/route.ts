import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Richiede la variabile d'ambiente ANTHROPIC_API_KEY (Vercel -> Project Settings -> Environment Variables).
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Sei un estrattore di dati da bollette di energia elettrica e gas italiane.
Ricevi la foto di una bolletta di un fornitore concorrente. Devi restituire
SOLO un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:

{
  "prezzoKwhLuce": number | null,
  "prezzoKwhGas": number | null,
  "ccvMensile": number | null,
  "totaleBolletta": number | null,
  "fornitore": string | null,
  "confidenza": "alta" | "media" | "bassa",
  "note": string | null
}

Regole:
- "prezzoKwhLuce"/"prezzoKwhGas": il prezzo unitario della materia energia in €/kWh (o €/Smc per il gas), NON il totale in euro.
- "ccvMensile": il corrispettivo fisso di commercializzazione/vendita mensile in euro, se presente.
- "totaleBolletta": il totale da pagare indicato in bolletta, se leggibile.
- Se un valore non è leggibile o non è presente, usa null. Non inventare numeri.
- "note": eventuali ambiguità (es. più prezzi per fasce orarie, valori poco leggibili).`;

export async function POST(req: NextRequest) {
  const { imageBase64, mediaType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: 'Immagine mancante' }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
          },
          { type: 'text', text: 'Estrai i dati da questa bolletta secondo le istruzioni.' }
        ]
      }
    ]
  });

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
