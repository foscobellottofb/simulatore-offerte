function Icona({ path, colore }: { path: string; colore: string }) {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: colore + '1A' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colore} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </div>
  );
}

const ICONE = {
  simulatore: 'M3 3v18h18 M7 15l4-6 3 4 5-8',
  confronto: 'M8 3v14a2 2 0 0 0 2 2h10 M4 7l3-3 3 3 M7 4v11 M16 21v-11 M13 18l3 3 3-3',
  mercato: 'M3 3v18h18 M7 14l4-5 3 3 6-8',
  admin: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
};

const NAVY = '#006FBB';
const TEAL = '#009A7A';

function VaiA({ href, colore, testo }: { href: string; colore: string; testo: string }) {
  return (
    <a href={href} className="text-xs font-medium hover:underline" style={{ color: colore }}>
      {testo} ↓
    </a>
  );
}

function Campo({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: '#E4E7E9' }}>
      <div className="font-medium text-sm">{titolo}</div>
      <div className="text-sm text-enel-ink/60 mt-0.5">{testo}</div>
    </div>
  );
}

export default function AiutoPage() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Aiuto</h1>
      <p className="text-sm text-enel-ink/60 mb-3">
        Cosa fa ogni pagina di simulOTTO, campo per campo. Riferimento rapido, non serve leggerla tutta d'un fiato —
        c'è anche un piccolo "?" accanto ai campi più delicati direttamente nelle pagine.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-8 p-3 rounded-lg bg-enel-paper border border-enel-line">
        <VaiA href="#simulatore" colore={NAVY} testo="Simulatore offerte" />
        <VaiA href="#confronto" colore={NAVY} testo="Confronto concorrenza" />
        <VaiA href="#mercato" colore={NAVY} testo="Mercato dell'energia" />
        <VaiA href="#admin" colore={NAVY} testo="Dati e parametri" />
      </div>

      {/* SIMULATORE */}
      <section id="simulatore" className="mb-10 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <Icona path={ICONE.simulatore} colore={NAVY} />
          <h2 className="text-lg font-semibold">Simulatore offerte</h2>
        </div>
        <p className="text-sm text-enel-ink/70 mb-4">
          Confronta tutte le offerte Enel disponibili per un profilo di consumo, e mostra qual è la più conveniente.
        </p>
        <div className="space-y-3">
          <Campo titolo="Commodity" testo="Luce o Gas. Cambia quali offerte vengono mostrate e l'unità di misura (kWh vs Smc)." />
          <Campo
            titolo='Tipo consumo: "Del periodo" vs "Annuo"'
            testo='"Del periodo" = hai già i kWh del periodo fatturato (es. da una bolletta reale). "Annuo" = hai una stima del consumo annuo, scalata automaticamente sui giorni fattura.'
          />
          <Campo
            titolo="Potenza kW"
            testo="La potenza impegnata del cliente (solo Luce). Determina la fascia ARERA (BTA1-BTA6) per i costi di rete, e filtra quali offerte sono disponibili."
          />
          <Campo
            titolo="Giorni fattura"
            testo="Il periodo simulato (es. 60 giorni per una bimestrale). Le quote fisse sono annualizzate e poi scalate su questo numero di giorni."
          />
        </div>

        <div className="mt-5 rounded-lg border border-enel-line p-4">
          <div className="text-sm font-medium mb-2">Come funzionano le offerte a più fasce (es. "Ore Happy")</div>
          <p className="text-xs text-enel-ink/60 mb-3">
            La maggior parte delle offerte ha un solo prezzo (F1). Alcune ne hanno due o tre (F1/F2/F3), validi in
            ore diverse: tu stimi quanto consumo ricade in F2/F3, il resto va in F1.
          </p>
          <div className="flex h-6 rounded overflow-hidden text-[10px] text-white font-medium">
            <div className="flex items-center justify-center" style={{ width: '80%', backgroundColor: NAVY }}>
              F1 · 80% del consumo
            </div>
            <div className="flex items-center justify-center" style={{ width: '20%', backgroundColor: TEAL }}>
              F2 · 20%
            </div>
          </div>
          <p className="text-[11px] text-enel-ink/40 mt-2">
            Esempio con "quota F2" impostata al 20%: spesa = 80% dei kWh × prezzo F1 + 20% dei kWh × prezzo F2.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-enel-amber/10 border border-enel-amber/30 p-3 text-xs text-enel-ink/70">
          <strong className="text-enel-ink">Perché un'offerta "variabile" a volte sembra più cara:</strong> senza
          accesso in tempo reale all'indice PUN/PSV, il simulatore usa il CAP (il tetto massimo) per prudenza — una
          stima conservativa, il prezzo reale mese per mese può essere più basso.
        </div>
      </section>

      {/* CONFRONTO */}
      <section id="confronto" className="mb-10 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <Icona path={ICONE.confronto} colore={TEAL} />
          <h2 className="text-lg font-semibold">Confronto concorrenza</h2>
        </div>
        <p className="text-sm text-enel-ink/70 mb-4">
          Non è solo un confronto prezzi. Mentre il Simulatore filtra le offerte Enel disponibili e mostra la
          migliore, questa pagina è pensata per l'intero momento della trattativa col cliente: legge la bolletta
          del concorrente da sola, e soprattutto aiuta a costruire il discorso di vendita — non solo a fare i
          conti.
        </p>

        <div className="rounded-lg border p-4 mb-5" style={{ borderColor: TEAL + '55', backgroundColor: TEAL + '0D' }}>
          <div className="text-sm font-semibold mb-3" style={{ color: TEAL }}>
            Le tre cose che la rendono più di un confronto prezzi
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium">📷 Lettura automatica della bolletta</div>
              <div className="text-enel-ink/60">
                Carica una foto o un PDF (anche più foto insieme, per bollette cartacee di più pagine): un'AI legge
                fornitore, prezzo, CCV, consumo, potenza e tutti i dati del cliente, e li compila da sola nel
                form.
              </div>
            </div>
            <div>
              <div className="font-medium">💬 Argomentario</div>
              <div className="text-enel-ink/60">
                Appena c'è un confronto, compaiono automaticamente i punti di forza pertinenti (se Enel vince, o gli
                argomenti giusti se il concorrente costa meno) — frasi pronte, modificabili da Admin.
              </div>
            </div>
            <div>
              <div className="font-medium">✍️ Caracozzo AI consiglia</div>
              <div className="text-enel-ink/60">
                Oltre alle frasi fisse, un pulsante genera un discorso su misura per quel cliente specifico: il
                risparmio calcolato, il fatto che avrà un consulente dedicato che lo segue nel tempo, e la
                solidità del marchio Enel — pronto da leggere a voce, non un elenco di punti.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Campo
            titolo="Foto o PDF bolletta"
            testo="Riservato agli operatori abilitati con password (consuma credito Anthropic). Segnala anche eventuali costi extra (mora, solleciti) separandoli dal costo normale dell'energia. Se non sei abilitato, compila tutto a mano — funziona identico."
          />
          <Campo
            titolo="Totale dichiarato"
            testo="Se il cliente ti ha detto il totale della sua bolletta, inseriscilo: il sistema calcola lo scarto rispetto al totale ricostruito, utile per verificare la coerenza dei dati."
          />
          <Campo
            titolo="Riquadro Confronto"
            testo="Appare dopo aver compilato prezzo e CCV del concorrente: mostra i due totali, il delta sul periodo, e il risparmio annuo stimato. Da qui in giù sotto compaiono l'argomentario e il pulsante per lo script AI."
          />
        </div>
      </section>

      {/* MERCATO */}
      <section id="mercato" className="mb-10 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <Icona path={ICONE.mercato} colore={NAVY} />
          <h2 className="text-lg font-semibold">Mercato dell'energia</h2>
        </div>
        <p className="text-sm text-enel-ink/70 mb-4">
          Pagina pubblica (nessun login) con contesto sul mercato all'ingrosso, per capire se il momento è caro o
          economico e confrontarsi con la concorrenza.
        </p>
        <div className="space-y-3">
          <Campo
            titolo="PUN e confronto anni precedenti"
            testo="Il PUN è il prezzo di riferimento dell'energia all'ingrosso (GME). Il confronto con 1-2 anni fa allo stesso mese aiuta a capire, per un contratto in scadenza, se il mercato oggi è più caro o economico."
          />
          <Campo
            titolo="Offerte concorrenti"
            testo='Prezzi raccolti dal team, verificati da un amministratore prima di comparire. Le offerte "solo web" sono separate. Quelle scadute spariscono da sole.'
          />
          <Campo
            titolo="Segnala un'offerta"
            testo="Aperto a chiunque, nessun accesso richiesto. Ogni segnalazione entra non attiva finché un amministratore non la verifica."
          />
        </div>
      </section>

      {/* ADMIN */}
      <section id="admin" className="mb-10 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <Icona path={ICONE.admin} colore="#5F5E5A" />
          <h2 className="text-lg font-semibold">Dati e parametri (Admin)</h2>
        </div>
        <p className="text-sm text-enel-ink/70 mb-4">
          Riservato a chi ha la password admin. Qui si aggiorna tutto quello che le altre pagine usano per
          calcolare — senza toccare il codice.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { t: 'Offerte', d: 'Prezzo F1 sempre; F2/F3 opzionali per offerte a più fasce, mantenuti come scritti, mai calcolati.' },
            { t: 'Parametri di dettaglio', d: 'IVA, accisa, trasmissione, misura, altre voci una tantum — comuni a tutte le offerte.' },
            { t: 'Rete e oneri', d: 'Componenti ARERA per fascia di potenza (BTA1-BTA6). ASOS/ARIM cambiano ogni trimestre.' },
            { t: 'PUN mensile', d: 'Serie storica per il grafico di Mercato. "Sincronizza da web" chiede a Claude di cercarlo.' },
            { t: 'Concorrenza', d: 'Offerte concorrenti mostrate su Mercato. Controlla le non attive prima di spuntarle.' },
            { t: 'Argomentario', d: 'Frasi di vendita usate in Confronto concorrenza per presentare il risultato al cliente.' }
          ].map((tab) => (
            <div key={tab.t} className="rounded-lg border border-enel-line p-3">
              <div className="text-sm font-medium">{tab.t}</div>
              <div className="text-xs text-enel-ink/60 mt-1">{tab.d}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-xs text-enel-ink/40 border-t border-enel-line pt-4">
        Qualcosa non torna o manca in questa pagina? Segnalalo così la aggiorniamo insieme.
      </div>
    </div>
  );
}
