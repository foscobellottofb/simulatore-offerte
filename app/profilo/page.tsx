'use client';

import { useEffect, useState } from 'react';

type Io = { nome: string; username: string; ruolo: 'MASTER' | 'TITOLARE' | 'CONSULENTE'; agenziaNome: string | null };

const ETICHETTA_RUOLO = { MASTER: 'Amministratore', TITOLARE: 'Titolare agenzia', CONSULENTE: 'Consulente' };

export default function ProfiloPage() {
  const [io, setIo] = useState<Io | null>(null);
  const [attuale, setAttuale] = useState('');
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [esito, setEsito] = useState<{ ok: boolean; testo: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setIo);
  }, []);

  async function cambiaPassword(e: React.FormEvent) {
    e.preventDefault();
    if (nuova !== conferma) {
      setEsito({ ok: false, testo: 'Le due password nuove non coincidono.' });
      return;
    }
    setSalvando(true);
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attuale, nuova })
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEsito({ ok: false, testo: data.error ?? 'Modifica non riuscita.' });
      return;
    }
    setAttuale('');
    setNuova('');
    setConferma('');
    setEsito({ ok: true, testo: 'Password aggiornata.' });
  }

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Il mio profilo</h1>

      {io && (
        <div className="card p-4 mb-6 text-sm space-y-1">
          <div><span className="text-enel-ink/50">Nome:</span> {io.nome}</div>
          <div><span className="text-enel-ink/50">Nome utente:</span> {io.username}</div>
          <div><span className="text-enel-ink/50">Ruolo:</span> {ETICHETTA_RUOLO[io.ruolo]}</div>
          {io.agenziaNome && <div><span className="text-enel-ink/50">Agenzia:</span> {io.agenziaNome}</div>}
        </div>
      )}

      <form onSubmit={cambiaPassword} className="card p-4 space-y-3">
        <div className="font-medium text-sm">Cambia password</div>
        <div>
          <label className="label">Password attuale</label>
          <input type="password" className="input" value={attuale} onChange={(e) => setAttuale(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="label">Nuova password (almeno 8 caratteri)</label>
          <input type="password" className="input" value={nuova} onChange={(e) => setNuova(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">Ripeti la nuova password</label>
          <input type="password" className="input" value={conferma} onChange={(e) => setConferma(e.target.value)} autoComplete="new-password" />
        </div>
        {esito && <div className={`text-xs ${esito.ok ? 'text-enel-greenDark' : 'text-red-600'}`}>{esito.testo}</div>}
        <button type="submit" className="btn-primary text-sm" disabled={salvando || !attuale || !nuova || !conferma}>
          {salvando ? 'Salvataggio…' : 'Aggiorna password'}
        </button>
      </form>

      <button
        className="btn-secondary text-sm mt-6"
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login';
        }}
      >
        Esci da simulOTTO
      </button>
    </div>
  );
}
