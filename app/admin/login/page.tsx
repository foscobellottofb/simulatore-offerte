'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCaricando(true);
    setErrore(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    setCaricando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error ?? 'Accesso non riuscito.');
      return;
    }
    router.push(params.get('next') || '/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-enel-paper px-4">
      <form onSubmit={handleSubmit} className="card p-6 w-full max-w-sm">
        <div className="text-lg font-semibold tracking-tight mb-1">Area riservata</div>
        <p className="text-sm text-enel-ink/60 mb-5">
          Accesso a "Dati e parametri" riservato a chi configura offerte e tariffe. Simulatore e Confronto
          concorrenza restano liberamente accessibili a tutti.
        </p>
        <label className="label">Password</label>
        <input
          type="password"
          className="input mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {errore && <div className="text-xs text-red-600 mb-4">{errore}</div>}
        <button type="submit" className="btn-primary text-sm w-full" disabled={caricando}>
          {caricando ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
