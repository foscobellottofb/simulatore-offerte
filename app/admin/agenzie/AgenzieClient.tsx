'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BoxCredenziali, GestioneUtenti, UtenteRiga, formatoAccesso, generaPassword } from '@/components/GestioneUtenti';

type Agenzia = {
  id: string;
  nome: string;
  attiva: boolean;
  note: string | null;
  createdAt: string;
  utenti: UtenteRiga[];
};

function ultimoAccessoAgenzia(a: Agenzia): string | null {
  const date = a.utenti.map((u) => u.ultimoAccesso).filter((d): d is string => !!d);
  return date.length ? date.sort().reverse()[0] : null;
}

function Riquadro({ valore, etichetta }: { valore: number; etichetta: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-semibold tracking-tight">{valore}</div>
      <div className="text-xs text-enel-ink/50">{etichetta}</div>
    </div>
  );
}

export function AgenzieClient() {
  const [agenzie, setAgenzie] = useState<Agenzia[]>([]);
  const [master, setMaster] = useState<UtenteRiga[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [aperta, setAperta] = useState<string | null>(null);

  const [nuova, setNuova] = useState(false);
  const [nomeAgenzia, setNomeAgenzia] = useState('');
  const [nomeTitolare, setNomeTitolare] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [credenziali, setCredenziali] = useState<{ username: string; password: string } | null>(null);

  async function carica() {
    const res = await fetch('/api/agenzie');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Impossibile caricare le agenzie.');
      setCaricato(true);
      return;
    }
    const data = await res.json();
    setAgenzie(data.agenzie);
    setMaster(data.master);
    setCaricato(true);
  }

  useEffect(() => {
    carica();
  }, []);

  async function creaAgenzia(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErrore(null);
    const user = username.trim().toLowerCase();
    const pw = password;
    const res = await fetch('/api/agenzie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeAgenzia, titolare: { nome: nomeTitolare, username: user, password: pw } })
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Creazione non riuscita.');
      return;
    }
    const creata = await res.json();
    setCredenziali({ username: user, password: pw });
    setNuova(false);
    setNomeAgenzia('');
    setNomeTitolare('');
    setUsername('');
    setPassword('');
    setAperta(creata.id);
    carica();
  }

  async function modificaAgenzia(a: Agenzia, dati: { nome?: string; attiva?: boolean }) {
    setErrore(null);
    const res = await fetch(`/api/agenzie/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Modifica non riuscita.');
    }
    carica();
  }

  const tuttiUtenti = agenzie.flatMap((a) => a.utenti);
  const setteGiorniFa = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Agenzie e utenti</h1>
      <p className="text-sm text-enel-ink/60 mb-6">
        Controllo centrale: crei le agenzie con il loro titolare, che poi aggiunge da solo i propri consulenti. Da qui
        puoi sospendere un'agenzia (blocca subito tutti i suoi utenti), disattivare singoli utenti o reimpostare una
        password. I dati comuni (offerte, PUN, PSV, oneri) restano in{' '}
        <Link href="/admin" className="text-enel-navy hover:underline">Dati e parametri</Link>.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Riquadro valore={agenzie.filter((a) => a.attiva).length} etichetta="agenzie attive" />
        <Riquadro valore={tuttiUtenti.filter((u) => u.attivo && u.ruolo === 'TITOLARE').length} etichetta="titolari attivi" />
        <Riquadro valore={tuttiUtenti.filter((u) => u.attivo && u.ruolo === 'CONSULENTE').length} etichetta="consulenti attivi" />
        <Riquadro
          valore={tuttiUtenti.filter((u) => u.ultimoAccesso && new Date(u.ultimoAccesso).getTime() > setteGiorniFa).length}
          etichetta="utenti attivi negli ultimi 7 giorni"
        />
      </div>

      {errore && <div className="text-sm text-red-600 mb-4">{errore}</div>}
      {credenziali && (
        <div className="mb-4">
          <BoxCredenziali {...credenziali} onChiudi={() => setCredenziali(null)} />
        </div>
      )}

      {!nuova ? (
        <button
          className="btn-primary text-sm mb-6"
          onClick={() => {
            setNuova(true);
            setPassword(generaPassword());
          }}
        >
          + Nuova agenzia
        </button>
      ) : (
        <form onSubmit={creaAgenzia} className="card p-4 mb-6 space-y-3">
          <div className="font-medium text-sm">Nuova agenzia</div>
          <div>
            <label className="label">Nome agenzia</label>
            <input className="input" value={nomeAgenzia} onChange={(e) => setNomeAgenzia(e.target.value)} autoFocus />
          </div>
          <div className="text-xs text-enel-ink/50 pt-1">Titolare (potrà creare i propri consulenti)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Nome e cognome</label>
              <input className="input" value={nomeTitolare} onChange={(e) => setNomeTitolare(e.target.value)} />
            </div>
            <div>
              <label className="label">Nome utente</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. mario.rossi"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="label">Password iniziale</label>
              <div className="flex gap-2">
                <input
                  className="input font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button type="button" className="btn-secondary text-xs" onClick={() => setPassword(generaPassword())}>
                  Genera
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={salvando || !nomeAgenzia || !nomeTitolare || !username || !password}
            >
              {salvando ? 'Creazione…' : 'Crea agenzia e titolare'}
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => setNuova(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {caricato && agenzie.length === 0 && (
        <div className="card p-6 text-sm text-enel-ink/60 mb-6">
          Nessuna agenzia ancora. Creane una qui sopra: suggerimento, parti dalla tua, così provi tu stesso come la
          vedranno titolari e consulenti.
        </div>
      )}

      <div className="space-y-3 mb-10">
        {agenzie.map((a) => {
          const attivi = a.utenti.filter((u) => u.attivo).length;
          const espansa = aperta === a.id;
          return (
            <div key={a.id} className="card">
              <div className="p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button className="flex-1 min-w-[12rem] text-left" onClick={() => setAperta(espansa ? null : a.id)}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.nome}</span>
                    {a.attiva ? (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-enel-green/10 text-enel-greenDark">Attiva</span>
                    ) : (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">Sospesa</span>
                    )}
                  </div>
                  <div className="text-xs text-enel-ink/50 mt-0.5">
                    {attivi} utenti attivi su {a.utenti.length} · ultimo accesso: {formatoAccesso(ultimoAccessoAgenzia(a))}
                  </div>
                </button>
                <div className="flex gap-4 text-xs">
                  <button className="text-enel-navy hover:underline" onClick={() => setAperta(espansa ? null : a.id)}>
                    {espansa ? 'Chiudi' : 'Utenti'}
                  </button>
                  <button
                    className="text-enel-ink/60 hover:underline"
                    onClick={() => {
                      const nome = prompt('Nuovo nome agenzia', a.nome);
                      if (nome && nome.trim() && nome.trim() !== a.nome) modificaAgenzia(a, { nome: nome.trim() });
                    }}
                  >
                    Rinomina
                  </button>
                  <button
                    className={a.attiva ? 'text-red-600 hover:underline' : 'text-enel-green hover:underline'}
                    onClick={() => {
                      if (a.attiva && !confirm(`Sospendere "${a.nome}"? Tutti i suoi utenti non potranno più entrare.`)) return;
                      modificaAgenzia(a, { attiva: !a.attiva });
                    }}
                  >
                    {a.attiva ? 'Sospendi' : 'Riattiva'}
                  </button>
                </div>
              </div>
              {espansa && (
                <div className="border-t border-enel-line px-4 pb-4 pt-1">
                  <GestioneUtenti utenti={a.utenti} modalita="MASTER" agenziaId={a.id} onAggiorna={carica} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold mb-2">Amministratori</h2>
      <div className="card p-4 text-sm">
        {master.map((m) => (
          <div key={m.id} className="py-1">
            <span className="font-medium">{m.nome}</span>{' '}
            <span className="text-xs text-enel-ink/50">
              · {m.username} · ultimo accesso: {formatoAccesso(m.ultimoAccesso)}
            </span>
          </div>
        ))}
        <div className="text-xs text-enel-ink/50 mt-2">
          Per aggiungere un amministratore o recuperare una password dimenticata usa la pagina{' '}
          <Link href="/setup" className="text-enel-navy hover:underline">/setup</Link> (serve la vecchia password
          Admin).
        </div>
      </div>
    </div>
  );
}
