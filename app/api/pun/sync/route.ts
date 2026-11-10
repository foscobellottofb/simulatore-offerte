import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { estraiJson } from '@/lib/estraiJson';
import { MeseAnno, nomeMese, quantiMesiDaBody, ultimiMesiConclusi } from '@/lib/mesiMercato';

// Richiede ANTHROPIC_API_KEY (già usata per l'OCR delle bollette concorrenti,
// vedi app/api/ocr/route.ts). Protetta dal login admin via middleware.ts,
// perché ogni chiamata consuma credito dell'account Anthropic.
//
// Aggiorna SOLO i mesi richiesti: di default l'ultimo mese concluso, oppure
// gli ultimi N mesi conclusi scelti in Admin (corpo { "mesi": N }).
// Gli altri mesi dello storico non vengono mai toccati.
const anthropic = new Anthropic();

function systemPrompt(mesi: MeseAnno[]) {
  const elenco = mesi.map((m) => `- ${nomeMese(m)} (anno ${m.anno}, mese ${m.mese})`).join('\n');
  return `Sei un ricercatore che consulta il web per trovare il valore medio mensile ufficiale del
PUN Index GME (Gestore dei Mercati Energetici, mercato elettrico italiano), in €/MWh, SOLO per questi mesi:
${elenco}

Dai priorità a mercatoelettrico.org (Esiti → MGP → Statistiche → Sintesi MGP, dettaglio mensile, colonna
"PUN Index GME – Media"). Se non disponibile, usa fonti secondarie affidabili (fornitori di energia,
comparatori, ARERA) che citano esplicitamente il dato GME di quel mese. Attenzione a non confondere un
mese con quello precedente o successivo, e a non usare valori orari, giornalieri, minimi o massimi.

Rispondi SOLO con un oggetto JSON, senza testo aggiuntivo, con questa forma esatta:
{ "mesi": [ { "anno": number, "mese": number, "trovato": boolean, "valoreMwh": number | null, "fonte": string, "confidenza": "alta" | "media" | "bassa" } ] }

Regole:
- Una voce per ciascun mese dell'elenco, nessun mese in più.
- "confidenza" è "alta" solo se la fonte è mercatoelettrico.org o cita esplicitamente il dato GME
  ufficiale di quel mese; "media" se è una fonte secondaria coerente con altre; "bassa" se è una stima.
- Se il dato di un mese non lo trovi con sicurezza, metti "trovato": false e "valoreMwh": null
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
    messages: [{ role: 'user', content: `Trova il PUN Index GME medio di: ${richiesti.map(nomeMese).join(', ')}.` }],
    // Cast a "any": alcune versioni dell'SDK non hanno ancora i tipi TS per
    // questo strumento, ma l'API lo accetta comunque (è solo JSON inoltrato).
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any
  });

  const testo = message.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n');

  type Voce = { anno: number; mese: number; trovato: boolean; valoreMwh: number | null; fonte: string; confidenza: string };
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
    const valore = typeof v?.valoreMwh === 'number' ? v.valoreMwh : NaN;
    // Controllo di buon senso: un PUN mensile fuori da 10-1000 €/MWh è quasi certamente un errore
    if (!v || !v.trovato || !Number.isFinite(valore) || valore < 10 || valore > 1000) {
      righe.push(`• ${nomeMese(m)}: non trovato, lasciato com'era`);
      continue;
    }
    const stimato = v.confidenza !== 'alta';
    const precedente = await prisma.punMensile.findUnique({ where: { anno_mese: m } });
    await prisma.punMensile.upsert({
      where: { anno_mese: m },
      update: { valoreMwh: valore, stimato },
      create: { ...m, valoreMwh: valore, stimato }
    });
    aggiornati++;
    righe.push(
      `• ${nomeMese(m)}: ${valore.toFixed(2)} €/MWh` +
        (precedente ? ` (prima ${precedente.valoreMwh.toFixed(2)})` : ' (nuovo)') +
        (stimato ? ` — STIMATO, fonte ${v.fonte || 'n/d'}: controllalo` : '')
    );
  }

  return NextResponse.json({
    ok: true,
    aggiornati,
    messaggio: `PUN: aggiornati ${aggiornati} mesi su ${richiesti.length}. Gli altri mesi dello storico non sono stati toccati.\n\n${righe.join('\n')}`
  });
}
