'use client';

import { useEffect, useState } from 'react';
import { GestioneUtenti, UtenteRiga } from '@/components/GestioneUtenti';

/** Pagina del TITOLARE: gestisce i consulenti della propria agenzia. */
export function AgenziaClient() {
  const [agenzia, setAgenzia] = useState<string | null>(null);
  const [utenti, setUtenti] = useState<UtenteRiga[]>([]);
  const [ioId, setIoId] = useState<string | undefined>();
  const [errore, setErrore] = useState<string | null>(null);

  async function carica() {
    const [resUtenti, resIo] = await Promise.all([fetch('/api/utenti'), fetch('/api/auth/me')]);
    if (!resUtenti.ok) {
      const data = await resUtenti.json().catch(() => ({}));
      setErrore(data.error ?? 'Impossibile caricare i consulenti.');
      return;
    }
    const data = await resUtenti.json();
    setAgenzia(data.agenzia);
    setUtenti(data.utenti);
    if (resIo.ok) setIoId((await resIo.json()).id);
  }

  useEffect(() => {
    carica();
  }, []);

  const consulentiAttivi = utenti.filter((u) => u.ruolo === 'CONSULENTE' && u.attivo).length;

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">La mia agenzia{agenzia ? `: ${agenzia}` : ''}</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Crea gli accessi per i tuoi consulenti e comunica loro nome utente e password. Se un consulente lascia
        l'agenzia, disattivalo: non potrà più entrare. Se dimentica la password, impostane una nuova da qui.
      </p>
      <div className="text-sm mb-4">
        <b>{consulentiAttivi}</b> consulenti attivi
      </div>
      {errore && <div className="text-sm text-red-600 mb-4">{errore}</div>}
      <div className="card p-4">
        <GestioneUtenti utenti={utenti} modalita="TITOLARE" ioId={ioId} onAggiorna={carica} />
      </div>
    </div>
  );
}
