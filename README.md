# Simulatore Offerte Enel Business

Scaffold funzionante di un simulatore per confrontare le offerte Enel SMB (luce/gas)
con offerte concorrenti, sostituendo il report Power BI. Costruito per essere
deployato su Vercel.

## Cosa contiene

- **`/simulatore`** — input kW/consumo → elenco offerte Enel disponibili + confronto voce per voce (accise, IVA, CCV, oneri…), come nel tuo report Power BI.
- **`/concorrenza`** — form essenziale (prezzo kWh + CCV concorrente) o foto della bolletta concorrente analizzata automaticamente, confronto diretto con la migliore offerta Enel e stima del risparmio annuo.
- **`/admin`** — tabella offerte Enel e tabella parametri di dettaglio (accise, IVA, oneri) editabile senza toccare il codice.
- Generazione **PDF** della bolletta simulata (`/api/pdf`), scaricabile dalla pagina simulatore.

## Deploy su Vercel — senza usare il terminale

Questo progetto è pensato per essere messo online interamente dal browser, senza installare Node.js sul tuo computer. Passi:

1. **GitHub**: crea un account gratuito su github.com, crea un nuovo repository (es. "enel-simulatore") e carica dentro tutti i file di questa cartella usando "Add file → Upload files" dal browser (puoi trascinare l'intera cartella).
2. **Vercel**: crea un account gratuito su vercel.com collegandolo con GitHub, poi "Add New Project" e scegli il repository appena creato. Vercel rileva da solo che è un progetto Next.js.
3. **Database**: prima di premere Deploy, vai nella scheda **Storage** del progetto Vercel → "Create Database" → Postgres. Vercel collega da solo la variabile `DATABASE_URL`.
4. **Variabili d'ambiente**: in Project Settings → Environment Variables aggiungi:
   - `ANTHROPIC_API_KEY` — necessaria solo per la lettura automatica delle foto bolletta (senza, l'app funziona lo stesso, si inserisce tutto a mano)
   - `SEED_SECRET` — inventa una password a caso (es. `enel2026xyz`), serve solo a te per popolare il database
   - `ADMIN_PASSWORD` — la password per entrare in "Dati e parametri" (`/admin`). Inventane una robusta: chiunque la conosca può modificare offerte e tariffe. `/simulatore` e `/concorrenza` restano pubblici, senza password.
5. **Deploy**. Il comando di build crea da solo tutte le tabelle nel database (non serve alcun comando da terminale).
6. **Carica i dati iniziali**: apri nel browser `https://tuo-progetto.vercel.app/api/seed?key=LA_PASSWORD_CHE_HAI_SCELTO` — questa pagina carica le offerte Enel e i parametri di partenza. La richiami ogni volta che vuoi ripristinare i dati di partenza.

Fatto: il sito è online su un indirizzo tipo `tuo-progetto.vercel.app`. Se vuoi un tuo dominio (anche uno già registrato su Register), lo colleghi da Project Settings → Domains.

## Setup locale (solo se in futuro vuoi lavorare da terminale)

```bash
npm install
cp .env.example .env.local
npx prisma db push
npm run db:seed
npm run dev
```

## Cosa manca / prossimi passi consigliati

Questo è un punto di partenza solido ma ci sono scelte da validare con te prima di darlo in mano alla rete vendita:

1. **Formula di calcolo** (`lib/calcoli.ts`) — ho ricostruito accise/IVA/oneri dai valori visti nel tuo report Power BI (caso 5.000 kWh, 20 kW, 60 giorni), scalandoli linearmente sui giorni fattura. Non è la formula ufficiale ARERA per scaglioni di potenza/consumo: va confrontata riga per riga con l'Excel/Power BI originale e corretta.
2. **CAP gas Flex Control** — nell'Excel era segnato "da verificare il calcolo del Cap Gas": l'ho importato così com'era ma segnalato nelle note dell'offerta.
3. **Import offerte da Excel** — oggi le offerte sono nel file di seed (`prisma/seed.ts`); se aggiorni spesso conviene un piccolo script che legge il file Excel/SharePoint e fa upsert nel database, così eviti di modificare codice ogni volta. Posso costruirlo se mi condividi la struttura esatta del file che usate oggi.
4. **Offerta variabile con CAP** — nel calcolo uso il CAP come scenario prudenziale (prezzo massimo), perché non c'è un indice PUN collegato. Se serve il prezzo indicizzato reale va integrata una fonte dati (es. indice PUN pubblicato da GME).
5. **Autenticazione** — l'app oggi non ha login: se la usa la rete commerciale conviene aggiungere una protezione semplice (password condivisa via Vercel Middleware, o login con NextAuth) prima di renderla pubblica.
6. **Offerta "Oro Happy" e sconti orari personalizzati** — modellata come `PERSONALIZZATA` con lo sconto e la fascia oraria salvati ma non ancora applicati nel calcolo: va definita la regola esatta (es. sconto sul prezzo nelle ore 12-15 dal secondo anno).

## Struttura

```
app/
  simulatore/        pagina + componente client del simulatore
  concorrenza/        confronto concorrente + upload foto (OCR)
  admin/              gestione offerte e parametri
  api/
    offerte/          CRUD offerte
    parametri/        lettura/aggiornamento parametri di dettaglio
    ocr/               estrazione dati da foto bolletta (Claude vision)
    pdf/                generazione PDF bolletta simulata
lib/
  calcoli.ts          motore di calcolo (offerte Enel + concorrente)
  types.ts            tipi condivisi
  BollettaPdf.tsx     template PDF
  db.ts               client Prisma
prisma/
  schema.prisma       modello dati (Offerta, ParametroDettaglio, Simulazione)
  seed.ts             dati iniziali ricostruiti dai tuoi file
```
