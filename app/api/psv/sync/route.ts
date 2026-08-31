import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { estraiJson } from '@/lib/estraiJson';

// Richiede ANTHROPIC_API_KEY (stessa usata per PUN, OCR, script di vendita).
// Protetta dal login admin via middleware.ts.
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Sei un ricercatore che consulta il web per trovare il valore ufficiale
dell'indice PSV gas (Punto di Scambio Virtuale, gestito da Snam nell'ambito del sistema gas
italiano, pubblicato/derivato dai dati GME) — l'equivalente del PUN per il gas naturale.

Cerca sul web i valori medi mensili del PSV (in €/Smc) per gli ULTIMI 3 mesi solari completi
rispetto a oggi, dando priorità a fonti che citano esplicitamente il dato ufficiale GME/Snam o la
componente CMEM ARERA (che è calcolata proprio sulla media mensile PSV Day Ahead).

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{
  "mesi": [
    { "anno": number, "mese": number, "valoreSmc": number, "fonte": string, "confidenza": "alta" | "media" | "bassa" }
  ]
}

Regole:
- "mese" è un numero 1-12.
- "valoreSmc" è il prezzo in €/Smc (se trovi solo il valore in €/MWh, convertilo dividendo per
  circa 9,4 — il fattore di conversione standard usato in Italia — e segnalalo in "fonte").
- "fonte" è il nome del sito/pagina da cui hai preso il dato.
- "confidenza" è "alta" solo se la fonte cita esplicitamente il dato ufficiale GME/Snam o la CMEM
  ARERA; "media" se è una fonte secondaria coerente con altre; "bassa" se è una stima o le fonti
  sono discordanti.
- Non includere il mese corrente se non ancora concluso.
- Se non trovi un dato affidabile per un mese, ometti quel mese piuttosto che inventarlo.`;

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
    messages: [{ role: 'user', content: 'Trova i valori PSV gas mensili più recenti disponibili.' }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any
  });

  const testo = message.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n');

  let parsed: { mesi: { anno: number; mese: number; valoreSmc: number; fonte: string; confidenza: string }[] };
  try {
    parsed = estraiJson(testo);
  } catch {
    return NextResponse.json({ error: 'Risposta non interpretabile, riprova.', raw: testo }, { status: 422 });
  }

  const risultati = [];
  for (const m of parsed.mesi ?? []) {
    if (!m.anno || !m.mese || m.valoreSmc == null) continue;
    const salvato = await prisma.psvMensile.upsert({
      where: { anno_mese: { anno: m.anno, mese: m.mese } },
      update: { valoreSmc: m.valoreSmc, stimato: m.confidenza !== 'alta' },
      create: { anno: m.anno, mese: m.mese, valoreSmc: m.valoreSmc, stimato: m.confidenza !== 'alta' }
    });
    risultati.push({ ...salvato, fonte: m.fonte, confidenza: m.confidenza });
  }

  return NextResponse.json({
    ok: true,
    messaggio: `Aggiornati ${risultati.length} mesi dal web.`,
    dettaglio: risultati
  });
}
