'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogoAccesso } from '@/components/LogoAccesso';

/**
 * Primo accesso dell'amministratore (master) o recupero della sua password.
 * Serve la "chiave di installazione" = la vecchia password dell'Admin
 * (variabile ADMIN_PASSWORD su Vercel).
 */
export default function SetupPage() {
  const [chiave, setChiave] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [conferma, setConferma] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== conferma) {
      setErrore('Le due password non coincidono.');
      return;
    }
    setCaricando(true);
    setErrore(null);
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiave, nome, username, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Operazione non riuscita.');
      setCaricando(false);
      return;
    }
    window.location.href = '/admin/agenzie';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-enel-paper px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-6 w-full max-w-sm">
        <LogoAccesso />
        <div className="text-lg font-semibold tracking-tight mb-1">Accesso amministratore</div>
        <p className="text-sm text-enel-ink/60 mb-5">
          Crea il tuo account da amministratore, oppure reimposta la password se l'hai dimenticata (inserisci lo
          stesso nome utente). Serve la vecchia password dell'area Admin.
        </p>

        <label className="label" htmlFor="chiave">Vecchia password Admin</label>
        <input id="chiave" type="password" className="input mb-4" value={chiave} onChange={(e) => setChiave(e.target.value)} autoFocus />

        <label className="label" htmlFor="nome">Il tuo nome</label>
        <input id="nome" className="input mb-4" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />

        <label className="label" htmlFor="username">Nome utente</label>
        <input
          id="username"
          className="input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="es. fosco"
        />

        <label className="label" htmlFor="password">Nuova password (almeno 8 caratteri)</label>
        <input id="password" type="password" className="input mb-4" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />

        <label className="label" htmlFor="conferma">Ripeti la password</label>
        <input id="conferma" type="password" className="input mb-4" value={conferma} onChange={(e) => setConferma(e.target.value)} autoComplete="new-password" />

        {errore && <div className="text-xs text-red-600 mb-4">{errore}</div>}
        <button
          type="submit"
          className="btn-primary text-sm w-full"
          disabled={caricando || !chiave || !nome || !username || !password || !conferma}
        >
          {caricando ? 'Salvataggio…' : 'Salva ed entra'}
        </button>
        <div className="mt-4 text-xs">
          <Link href="/login" className="text-enel-navy hover:underline">← Torna al login</Link>
        </div>
      </form>
    </div>
  );
}
