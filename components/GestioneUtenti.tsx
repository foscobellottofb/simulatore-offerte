'use client';

import { useState } from 'react';

/**
 * Elenco utenti di UN'agenzia con le azioni di gestione, condiviso da:
 *  - pagina "Agenzie e utenti" del master (modalita = 'MASTER')
 *  - pagina "La mia agenzia" del titolare (modalita = 'TITOLARE')
 * Le regole vere (chi può fare cosa) sono controllate dal server in
 * /api/utenti: qui si nascondono solo i pulsanti che non avrebbero effetto.
 */

export type RuoloUtente = 'MASTER' | 'TITOLARE' | 'CONSULENTE';

export type UtenteRiga = {
  id: string;
  username: string;
  nome: string;
  ruolo: RuoloUtente;
  attivo: boolean;
  ultimoAccesso: string | null;
  numeroAccessi: number;
  createdAt: string;
};

const ETICHETTA_RUOLO: Record<RuoloUtente, string> = {
  MASTER: 'Amministratore',
  TITOLARE: 'Titolare',
  CONSULENTE: 'Consulente'
};

export function generaPassword(): string {
  // Niente caratteri che si confondono (0/O, 1/l/I), così si detta facilmente.
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const casuali = new Uint32Array(10);
  crypto.getRandomValues(casuali);
  return Array.from(casuali, (n) => alfabeto[n % alfabeto.length]).join('');
}

export function formatoAccesso(d: string | null): string {
  if (!d) return 'mai entrato';
  return new Date(d).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function chiamata(url: string, metodo: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.error ?? 'Operazione non riuscita.';
}

export function BoxCredenziali({ username, password, onChiudi }: { username: string; password: string; onChiudi: () => void }) {
  const testo = `simulOTTO\nNome utente: ${username}\nPassword: ${password}`;
  const [copiato, setCopiato] = useState(false);
  return (
    <div className="rounded-lg border border-enel-green/40 bg-enel-green/5 p-3 text-sm">
      <div className="font-medium mb-1">Credenziali da comunicare</div>
      <div className="font-mono text-xs">
        Nome utente: <b>{username}</b>
        <br />
        Password: <b>{password}</b>
      </div>
      <div className="text-xs text-enel-ink/50 mt-1">
        Annotala ora: per sicurezza la password non sarà più visibile. Potrà cambiarla da "Il mio profilo".
      </div>
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          className="text-xs text-enel-navy hover:underline"
          onClick={() => {
            navigator.clipboard?.writeText(testo).then(() => setCopiato(true));
          }}
        >
          {copiato ? 'Copiato ✓' : 'Copia'}
        </button>
        <button type="button" className="text-xs text-enel-ink/50 hover:underline" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

export function GestioneUtenti({
  utenti,
  modalita,
  agenziaId,
  ioId,
  onAggiorna
}: {
  utenti: UtenteRiga[];
  modalita: 'MASTER' | 'TITOLARE';
  agenziaId?: string;
  ioId?: string;
  onAggiorna: () => void;
}) {
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [credenziali, setCredenziali] = useState<{ username: string; password: string } | null>(null);

  const [aggiungi, setAggiungi] = useState(false);
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ruolo, setRuolo] = useState<'CONSULENTE' | 'TITOLARE'>('CONSULENTE');

  function gestibile(u: UtenteRiga) {
    if (u.id === ioId || u.ruolo === 'MASTER') return false;
    return modalita === 'MASTER' || u.ruolo === 'CONSULENTE';
  }

  async function esegui(fn: () => Promise<string | null>) {
    setInCorso(true);
    setErrore(null);
    const err = await fn();
    setInCorso(false);
    if (err) setErrore(err);
    else onAggiorna();
    return !err;
  }

  async function salvaPassword(u: UtenteRiga) {
    const pw = nuovaPassword;
    const ok = await esegui(() => chiamata(`/api/utenti/${u.id}`, 'PATCH', { password: pw }));
    if (ok) {
      setResetId(null);
      setNuovaPassword('');
      setCredenziali({ username: u.username, password: pw });
    }
  }

  async function crea(e: React.FormEvent) {
    e.preventDefault();
    const pw = password;
    const user = username.trim().toLowerCase();
    const ok = await esegui(() =>
      chiamata('/api/utenti', 'POST', {
        nome,
        username: user,
        password: pw,
        ...(modalita === 'MASTER' ? { ruolo, agenziaId } : {})
      })
    );
    if (ok) {
      setCredenziali({ username: user, password: pw });
      setNome('');
      setUsername('');
      setPassword('');
      setRuolo('CONSULENTE');
      setAggiungi(false);
    }
  }

  return (
    <div className="space-y-3">
      {credenziali && (
        <BoxCredenziali {...credenziali} onChiudi={() => setCredenziali(null)} />
      )}
      {errore && <div className="text-xs text-red-600">{errore}</div>}

      {utenti.length === 0 && <div className="text-sm text-enel-ink/50">Nessun utente ancora.</div>}

      <div className="divide-y divide-enel-line">
        {utenti.map((u) => (
          <div key={u.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-medium ${u.attivo ? '' : 'text-enel-ink/40 line-through'}`}>{u.nome}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded ${
                  u.ruolo === 'TITOLARE' ? 'bg-enel-navy/10 text-enel-navy' : 'bg-enel-paper text-enel-ink/60 border border-enel-line'
                }`}
              >
                {ETICHETTA_RUOLO[u.ruolo]}
              </span>
              {!u.attivo && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">Disattivato</span>}
              {u.id === ioId && <span className="text-[11px] text-enel-ink/40">(tu)</span>}
            </div>
            <div className="text-xs text-enel-ink/50 mt-0.5">
              {u.username} · ultimo accesso: {formatoAccesso(u.ultimoAccesso)} · {u.numeroAccessi} login
            </div>

            {gestibile(u) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                <button
                  className={u.attivo ? 'text-red-600 hover:underline' : 'text-enel-green hover:underline'}
                  disabled={inCorso}
                  onClick={() => {
                    if (u.attivo && !confirm(`Disattivare ${u.nome}? Non potrà più entrare finché non lo riattivi.`)) return;
                    esegui(() => chiamata(`/api/utenti/${u.id}`, 'PATCH', { attivo: !u.attivo }));
                  }}
                >
                  {u.attivo ? 'Disattiva' : 'Riattiva'}
                </button>
                <button
                  className="text-enel-navy hover:underline"
                  disabled={inCorso}
                  onClick={() => {
                    setResetId(resetId === u.id ? null : u.id);
                    setNuovaPassword(generaPassword());
                  }}
                >
                  Nuova password
                </button>
                {modalita === 'MASTER' && (
                  <button
                    className="text-enel-ink/60 hover:underline"
                    disabled={inCorso}
                    onClick={() =>
                      esegui(() =>
                        chiamata(`/api/utenti/${u.id}`, 'PATCH', {
                          ruolo: u.ruolo === 'TITOLARE' ? 'CONSULENTE' : 'TITOLARE'
                        })
                      )
                    }
                  >
                    {u.ruolo === 'TITOLARE' ? 'Rendi consulente' : 'Rendi titolare'}
                  </button>
                )}
              </div>
            )}

            {resetId === u.id && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input
                  className="input !w-48 font-mono"
                  value={nuovaPassword}
                  onChange={(e) => setNuovaPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button className="btn-secondary text-xs" type="button" onClick={() => setNuovaPassword(generaPassword())}>
                  Genera
                </button>
                <button className="btn-primary text-xs" disabled={inCorso} onClick={() => salvaPassword(u)}>
                  Salva
                </button>
                <button className="text-xs text-enel-ink/50 hover:underline" onClick={() => setResetId(null)}>
                  Annulla
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!aggiungi ? (
        <button
          className="btn-secondary text-xs"
          onClick={() => {
            setAggiungi(true);
            setPassword(generaPassword());
          }}
        >
          + Aggiungi {modalita === 'MASTER' ? 'utente' : 'consulente'}
        </button>
      ) : (
        <form onSubmit={crea} className="rounded-lg border border-enel-line bg-enel-paper p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome e cognome</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
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
            {modalita === 'MASTER' && (
              <div>
                <label className="label">Ruolo</label>
                <select className="input" value={ruolo} onChange={(e) => setRuolo(e.target.value as 'CONSULENTE' | 'TITOLARE')}>
                  <option value="CONSULENTE">Consulente</option>
                  <option value="TITOLARE">Titolare</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs" disabled={inCorso || !nome || !username || !password}>
              {inCorso ? 'Salvataggio…' : 'Crea'}
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => setAggiungi(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
