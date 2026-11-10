import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { estraiJson } from '@/lib/estraiJson';
import { MeseAnno, nomeMese, quantiMesiDaBody, ultimiMesiConclusi } from '@/lib/mesiMercato';

// Richiede ANTHROPIC_API_KEY (stessa usata per PUN, OCR, script di vendita).
// Protetta dal login admin via middleware.ts.
//
// Aggiorna SOLO i mesi richiesti: di default l'ultimo mese concluso, oppure
// gli ultimi N mesi conclusi scelti in Admin (corpo { "mesi": N }).
// Gli altri mesi dello storico non vengono mai toccati.
const anthropic = new Anthropic();

function systemPrompt(mesi: MeseAnno[]) {
  const elenco = mesi.map((m) => `- ${nomeMese(m)} (anno ${m.anno}, mese ${m.mese})`).join('\n');
  return `Sei un ricercatore che consulta il web per trovare il valore medio mensile dell'indice PSV gas
(Punto di Scambio Virtuale, mercato all'ingrosso del gas italiano; Day Ahead), in €/Smc, SOLO per questi mesi:
${elenco}

Dai priorità a fonti che citano esplicitamente il dato ufficiale GME/Snam o la componente CMEM ARERA
(calcolata proprio sulla media mensile PSV Day Ahead). Attenzione a non confondere un mese con quello
precedente o successivo.

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{ "mesi": [ { "anno": number, "mese": number, "trovato": boolean, "valoreSmc": number | null, "fonte": string, "confidenza": "alta" | "media" | "bassa" } ] }

Regole:
- Una voce per ciascun mese dell'elenco, nessun mese in più.
- "valoreSmc" è il prezzo in €/Smc. Se trovi solo il valore in €/MWh, convertilo dividendo per
  circa 9,4 (fattore standard usato in Italia) e scrivilo in "fonte".
- "confidenza" è "alta" solo se la fonte cita esplicitamente il dato ufficiale GME/Snam o la CMEM
  ARERA; "media" se è una fonte secondaria coerente con altre; "bassa" se è una stima.
- Se il dato di un mese non lo trovi con sicurezza, metti "trovato": false e "valoreSmc": null
  invece di inventarlo.`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const richiesti = ultimiMesiConclusi(quantiMesiDaBody(body));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: systemPrompt(richiesti),
    messages: [{ role: 'user', content: `Trova il PSV medio mensile di: ${richiesti.map(nomeMese).join(', ')}.` }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any
  });

  const testo = message.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n');

  type Voce = { anno: number; mese: number; trovato: boolean; valoreSmc: number | null; fonte: string; confidenza: string };
  let parsed: { mesi: Voce[] };
  try {
    parsed = estraiJson(testo);
  } catch {
    return NextResponse.json({ error: 'Risposta non interpretabile, riprova.', raw: testo }, { status: 422 });
  }

  const righe: string[] = [];
  let aggiornati = 0;
  for (const m of richiesti) {
    const v = (parsed.mesi ?? []).find((x) => Number(x.anno) === m.anno && Number(x.mese) === m.mese);
    const valore = typeof v?.valoreSmc === 'number' ? v.valoreSmc : NaN;
    // Controllo di buon senso: un PSV mensile fuori da 0,05-5 €/Smc è quasi certamente un errore
    if (!v || !v.trovato || !Number.isFinite(valore) || valore < 0.05 || valore > 5) {
      righe.push(`• ${nomeMese(m)}: non trovato, lasciato com'era`);
      continue;
    }
    const stimato = v.confidenza !== 'alta';
    const precedente = await prisma.psvMensile.findUnique({ where: { anno_mese: m } });
    await prisma.psvMensile.upsert({
      where: { anno_mese: m },
      update: { valoreSmc: valore, stimato },
      create: { ...m, valoreSmc: valore, stimato }
    });
    aggiornati++;
    righe.push(
      `• ${nomeMese(m)}: ${valore.toFixed(3)} €/Smc` +
        (precedente ? ` (prima ${precedente.valoreSmc.toFixed(3)})` : ' (nuovo)') +
        (stimato ? ` — STIMATO, fonte ${v.fonte || 'n/d'}: controllalo` : '')
    );
  }

  return NextResponse.json({
    ok: true,
    aggiornati,
    messaggio: `PSV: aggiornati ${aggiornati} mesi su ${richiesti.length}. Gli altri mesi dello storico non sono stati toccati.\n\n${righe.join('\n')}`
  });
}
