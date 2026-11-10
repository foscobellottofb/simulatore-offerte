'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LogoAccesso } from '@/components/LogoAccesso';

// useSearchParams() va dentro un <Suspense>, altrimenti il build di Next fallisce.
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCaricando(true);
    setErrore(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Accesso non riuscito.');
      setCaricando(false);
      return;
    }
    // Solo indirizzi interni (evita di essere rimandati su siti esterni)
    const next = params.get('next');
    window.location.href = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 w-full max-w-sm">
      <LogoAccesso />
      <div className="text-lg font-semibold tracking-tight mb-1">Accedi</div>
      <p className="text-sm text-enel-ink/60 mb-5">
        Usa le credenziali che ti ha dato il titolare della tua agenzia.
      </p>
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
        autoFocus
      />
      <label className="label" htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        className="input mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {errore && <div className="text-xs text-red-600 mb-4">{errore}</div>}
      <button type="submit" className="btn-primary text-sm w-full" disabled={caricando || !username || !password}>
        {caricando ? 'Accesso…' : 'Entra'}
      </button>
      <div className="mt-5 pt-4 border-t border-enel-line text-xs text-enel-ink/50 space-y-1">
        <div>Password dimenticata? Chiedi al titolare della tua agenzia di impostarne una nuova.</div>
        <div>
          <Link href="/mercato" className="text-enel-navy hover:underline">Mercato dell'energia</Link>
          {' · '}
          <Link href="/setup" className="text-enel-navy hover:underline">Primo accesso amministratore</Link>
        </div>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-enel-paper px-4 py-10">
      <Suspense fallback={<div className="text-sm text-enel-ink/40">Caricamento…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
