export default function AiutoPage() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Aiuto</h1>
      <p className="text-sm text-enel-ink/60 mb-8">
        Cosa fa ogni pagina di simulOTTO, campo per campo. Pensata come riferimento rapido, non serve leggerla tutta
        d'un fiato.
      </p>

      {/* SIMULATORE */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Simulatore offerte</h2>
        <p className="text-sm text-enel-ink/70 mb-3">
          Confronta tutte le offerte Enel disponibili per un profilo di consumo, e mostra qual è la più conveniente.
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium">Commodity</div>
            <div className="text-enel-ink/60">Luce o Gas. Cambia quali offerte vengono mostrate e l'unità di misura (kWh vs Smc).</div>
          </div>
          <div>
            <div className="font-medium">Tipo consumo: "Del periodo" vs "Annuo"</div>
            <div className="text-enel-ink/60">
              "Del periodo" = hai un numero di kWh già riferito ai giorni fattura (es. letto da una bolletta reale).
              "Annuo" = hai una stima del consumo annuo del cliente, e il sistema lo scala automaticamente sui
              giorni fattura inseriti.
            </div>
          </div>
          <div>
            <div className="font-medium">Potenza kW</div>
            <div className="text-enel-ink/60">
              La potenza impegnata del cliente (solo Luce). Determina la fascia ARERA (BTA1-BTA6) usata per calcolare
              i costi di rete e gli oneri di sistema, e filtra quali offerte sono disponibili (alcune hanno un range
              di potenza minimo/massimo).
            </div>
          </div>
          <div>
            <div className="font-medium">Giorni fattura</div>
            <div className="text-enel-ink/60">
              Il periodo di fatturazione simulato (es. 60 giorni per una bolletta bimestrale). Incide su quanto
              pesano le quote fisse (CCV, quota fissa e potenza di rete), che sono annualizzate e poi scalate su
              questo numero di giorni.
            </div>
          </div>
          <div>
            <div className="font-medium">Quota consumo stimata in F2 / F3 (%)</div>
            <div className="text-enel-ink/60">
              Compare solo se almeno un'offerta disponibile ha più fasce di prezzo (es. "Ore Happy" con F1 + F2).
              Rappresenta quanto del consumo del cliente stimi che ricada nella fascia F2 (e F3, se presente): non lo
              sappiamo con precisione senza una lettura oraria, quindi si chiede al cliente o si stima. Esempio: 20%
              → l'80% dei kWh viene calcolato al prezzo F1, il 20% al prezzo F2, poi sommati.
            </div>
          </div>
          <div>
            <div className="font-medium">Nome cliente, POD, indirizzo fornitura, Cod. Fiscale/P.IVA</div>
            <div className="text-enel-ink/60">
              Tutti opzionali: servono solo per intestare il PDF della bolletta simulata, non influenzano il
              calcolo.
            </div>
          </div>
          <div>
            <div className="font-medium">Colonna "Prezzo" in tabella</div>
            <div className="text-enel-ink/60">
              Mostra F1 (e F2/F3 se presenti, con le ore tra parentesi) così come inseriti in Admin. Per le offerte a
              prezzo variabile mostra "CAP" — vedi sotto.
            </div>
          </div>
          <div>
            <div className="font-medium">Perché un'offerta a "prezzo variabile" a volte sembra più cara</div>
            <div className="text-enel-ink/60">
              Il simulatore non ha accesso in tempo reale all'indice PUN/PSV su cui si basano le offerte indicizzate:
              per prudenza usa il CAP (il tetto massimo che il cliente pagherebbe) come prezzo. È una stima
              conservativa, il prezzo reale mese per mese può essere più basso.
            </div>
          </div>
        </div>
      </section>

      {/* CONFRONTO CONCORRENZA */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Confronto concorrenza</h2>
        <p className="text-sm text-enel-ink/70 mb-3">
          Confronta la migliore offerta Enel disponibile contro un'offerta concorrente, di cui inserisci solo prezzo
          e CCV (il resto — rete, oneri, accisa, IVA — è uguale per tutti i fornitori, regolato da ARERA).
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium">Dati cliente (in alto)</div>
            <div className="text-enel-ink/60">
              Stessi campi del Simulatore (commodity, consumo, potenza, giorni fattura): servono per calcolare sia
              l'offerta Enel migliore sia il totale del concorrente sullo stesso profilo.
            </div>
          </div>
          <div>
            <div className="font-medium">Foto o PDF bolletta</div>
            <div className="text-enel-ink/60">
              Riservato agli operatori abilitati con password (consuma credito dell'account Anthropic collegato).
              Se sei abilitato, carica una foto o un PDF della bolletta concorrente: un'AI prova a leggere
              automaticamente fornitore, prezzo, CCV, totale, e segnala eventuali costi extra (mora, spese di
              sollecito...) distinguendoli dal costo normale dell'energia. Se non sei abilitato, o se preferisci,
              compila i campi sotto a mano — funziona identico.
            </div>
          </div>
          <div>
            <div className="font-medium">Fornitore, Tipo prezzo, Prezzo, CCV mensile</div>
            <div className="text-enel-ink/60">Dati dell'offerta concorrente. Il "Tipo prezzo" (Fisso/Variabile) è solo informativo in questa pagina.</div>
          </div>
          <div>
            <div className="font-medium">Totale dichiarato</div>
            <div className="text-enel-ink/60">
              Opzionale: se il cliente ti ha detto il totale della sua bolletta, inseriscilo qui. Il sistema calcola
              lo scarto rispetto al totale ricostruito dal prezzo/CCV inseriti — utile per capire se i dati che hai
              raccolto sono coerenti.
            </div>
          </div>
          <div>
            <div className="font-medium">Riquadro "Confronto"</div>
            <div className="text-enel-ink/60">
              Appare solo dopo aver compilato prezzo e CCV del concorrente. Mostra i due totali affiancati, il delta
              sul periodo fatturato, e il risparmio annuo stimato (proiezione del delta del periodo su 365 giorni).
            </div>
          </div>
          <div>
            <div className="font-medium">Scarica PDF Enel</div>
            <div className="text-enel-ink/60">Genera una bolletta simulata in PDF per l'offerta Enel migliore, in stile Enel, da mostrare o lasciare al cliente.</div>
          </div>
        </div>
      </section>

      {/* MERCATO */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Mercato dell'energia</h2>
        <p className="text-sm text-enel-ink/70 mb-3">
          Pagina pubblica (nessun login) con contesto sul mercato all'ingrosso, per capire se il momento attuale è
          caro o economico e per confrontarsi con la concorrenza.
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium">PUN corrente e confronto anni precedenti</div>
            <div className="text-enel-ink/60">
              Il PUN (oggi "PUN Index GME") è il prezzo di riferimento dell'energia all'ingrosso, pubblicato
              mensilmente dal GME. Il confronto con 1-2 anni fa allo stesso mese aiuta a capire, per un cliente col
              contratto in scadenza, se il mercato oggi è più caro o più economico di quando aveva sottoscritto.
            </div>
          </div>
          <div>
            <div className="font-medium">Grafico multi-anno</div>
            <div className="text-enel-ink/60">
              Andamento mensile del PUN per più anni. I tratti tratteggiati indicano mesi "stimati" (fonte non
              ufficiale/da verificare) invece che dati confermati.
            </div>
          </div>
          <div>
            <div className="font-medium">Offerte concorrenti (Web / Altri canali)</div>
            <div className="text-enel-ink/60">
              Prezzi indicativi raccolti dal team, verificati da un amministratore prima di comparire qui. Le offerte
              "solo web" sono separate perché hanno condizioni spesso non replicabili in una trattativa diretta. Le
              offerte con una data di scadenza passata scompaiono automaticamente, senza bisogno di disattivarle a
              mano.
            </div>
          </div>
          <div>
            <div className="font-medium">Segnala un'offerta concorrente</div>
            <div className="text-enel-ink/60">
              Aperto a chiunque, nessun accesso richiesto. Ogni segnalazione entra "non attiva" e non compare
              pubblicamente finché un amministratore non la verifica (anche guardando l'eventuale documento
              allegato) e la attiva da Admin.
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Dati e parametri (Admin)</h2>
        <p className="text-sm text-enel-ink/70 mb-3">
          Riservato a chi ha la password admin. Qui si aggiorna tutto quello che il Simulatore e le altre pagine
          usano per calcolare — senza toccare il codice.
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium">Tab "Offerte"</div>
            <div className="text-enel-ink/60 mt-1">
              Elenco delle offerte Enel. "Prezzo F1" è l'unico prezzo da compilare per la maggior parte delle
              offerte. Le sezioni "Fascia F2" e "Fascia F3" sono opzionali, solo per offerte con più prezzi in ore
              diverse (es. "Ore Happy"): ora inizio/fine e il prezzo esatto di quella fascia, mantenuto così com'è
              scritto sulla scheda dell'offerta — mai calcolato da una percentuale. "Note" compare in rosso/arancio
              accanto al nome offerta nell'elenco: usale per segnalare discrepanze da verificare (es. tra due fonti
              dati diverse).
            </div>
          </div>
          <div>
            <div className="font-medium">Tab "Parametri di dettaglio"</div>
            <div className="text-enel-ink/60 mt-1">
              Voci comuni a tutte le offerte di una commodity: IVA, accisa, trasmissione, misura, altre voci una
              tantum. Modifica il valore direttamente nella casella, poi "Salva parametri" in fondo.
            </div>
          </div>
          <div>
            <div className="font-medium">Tab "Rete e oneri"</div>
            <div className="text-enel-ink/60 mt-1">
              Componenti ARERA di distribuzione e oneri di sistema (ASOS/ARIM), una riga per fascia di potenza
              (BTA1-BTA6). Gli oneri ASOS/ARIM cambiano ogni trimestre con delibera ARERA: da aggiornare qui quando
              arriva la nuova delibera.
            </div>
          </div>
          <div>
            <div className="font-medium">Tab "PUN mensile"</div>
            <div className="text-enel-ink/60 mt-1">
              Serie storica usata dal grafico di "Mercato dell'energia". Aggiungi il mese corrente non appena il GME
              lo pubblica. Il pulsante "Sincronizza da web" chiede a Claude di cercarlo automaticamente (richiede
              ANTHROPIC_API_KEY configurata, consuma credito).
            </div>
          </div>
          <div>
            <div className="font-medium">Tab "Concorrenza"</div>
            <div className="text-enel-ink/60 mt-1">
              Offerte concorrenti mostrate su "Mercato dell'energia". Qui vedi anche quelle non ancora attive
              (segnalate dal campo o trovate dal web, badge giallo "⚠ Non attiva") — controllale e spunta "Attiva"
              solo quelle verificate. Una data "valida al" nel passato le nasconde automaticamente dal pubblico anche
              se restano spuntate come attive.
            </div>
          </div>
          <div>
            <div className="font-medium">Tab "Argomentario"</div>
            <div className="text-enel-ink/60 mt-1">
              Frasi/argomenti di vendita usati nella pagina "Confronto concorrenza" per suggerire come presentare il
              risultato al cliente.
            </div>
          </div>
        </div>
      </section>

      <div className="text-xs text-enel-ink/40 border-t border-enel-line pt-4">
        Qualcosa non torna o manca in questa pagina? Segnalalo così la aggiorniamo insieme.
      </div>
    </div>
  );
}
