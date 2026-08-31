import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { estraiJson } from '@/lib/estraiJson';

// Richiede ANTHROPIC_API_KEY (già usata per l'OCR delle bollette concorrenti,
// vedi app/api/ocr/route.ts). Protetta dal login admin via middleware.ts,
// perché ogni chiamata consuma credito dell'account Anthropic.
const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Sei un ricercatore che consulta il web per trovare il valore ufficiale del
PUN Index GME (indice del Gestore dei Mercati Energetici italiano, mercato elettrico all'ingrosso).

Cerca sul web i valori medi mensili del PUN Index GME (in €/MWh) per gli ULTIMI 3 mesi solari
completi rispetto a oggi, dando priorità a mercatoelettrico.org come fonte primaria e, se non
disponibile, a fonti secondarie affidabili (fornitori di energia, comparatori) che citano
esplicitamente il dato GME.

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{
  "mesi": [
    { "anno": number, "mese": number, "valoreMwh": number, "fonte": string, "confidenza": "alta" | "media" | "bassa" }
  ]
}

Regole:
- "mese" è un numero 1-12.
- "fonte" è il nome del sito/pagina da cui hai preso il dato (es. "mercatoelettrico.org", "nome sito").
- "confidenza" è "alta" solo se la fonte è mercatoelettrico.org o cita esplicitamente il dato GME
  ufficiale; "media" se è una fonte secondaria coerente con altre; "bassa" se è una stima o le fonti
  sono discordanti.
- Non includere il mese corrente se non ancora concluso (il PUN mensile si calcola solo a mese finito).
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
    messages: [{ role: 'user', content: 'Trova i valori PUN mensili più recenti disponibili.' }],
    // Cast a "any": alcune versioni dell'SDK non hanno ancora i tipi TS per
    // questo strumento, ma l'API lo accetta comunque (è solo JSON inoltrato).
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any
  });

  const testo = message.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n');

  let parsed: { mesi: { anno: number; mese: number; valoreMwh: number; fonte: string; confidenza: string }[] };
  try {
    parsed = estraiJson(testo);
  } catch {
    return NextResponse.json({ error: 'Risposta non interpretabile, riprova.', raw: testo }, { status: 422 });
  }

  const risultati = [];
  for (const m of parsed.mesi ?? []) {
    if (!m.anno || !m.mese || m.valoreMwh == null) continue;
    const salvato = await prisma.punMensile.upsert({
      where: { anno_mese: { anno: m.anno, mese: m.mese } },
      update: { valoreMwh: m.valoreMwh, stimato: m.confidenza !== 'alta' },
      create: { anno: m.anno, mese: m.mese, valoreMwh: m.valoreMwh, stimato: m.confidenza !== 'alta' }
    });
    risultati.push({ ...salvato, fonte: m.fonte, confidenza: m.confidenza });
  }

  return NextResponse.json({
    ok: true,
    messaggio: `Aggiornati ${risultati.length} mesi dal web.`,
    dettaglio: risultati
  });
}
