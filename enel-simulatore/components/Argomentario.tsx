'use client';

import { ArgomentoVendita, TipoArgomento } from '@/lib/types';

/**
 * Mostra gli argomenti di supporto pertinenti (letti dal database, gestibili
 * da Admin → Argomentario) in base al risultato del confronto e al tipo di
 * prezzo del concorrente.
 */
export function Argomentario({
  argomenti,
  enelVince,
  tipoPrezzoConcorrente
}: {
  argomenti: ArgomentoVendita[];
  enelVince: boolean;
  tipoPrezzoConcorrente: 'FISSO' | 'VARIABILE';
}) {
  const tipiRilevanti: TipoArgomento[] = enelVince
    ? ['ENEL_VINCE']
    : [tipoPrezzoConcorrente === 'VARIABILE' ? 'CONCORRENTE_VARIABILE' : 'CONCORRENTE_FISSO', 'GENERALE'];

  const punti = argomenti
    .filter((a) => a.attivo && tipiRilevanti.includes(a.tipo))
    .sort((a, b) => tipiRilevanti.indexOf(a.tipo) - tipiRilevanti.indexOf(b.tipo) || a.ordinamento - b.ordinamento);

  if (punti.length === 0) return null;

  if (enelVince) {
    return (
      <div className="rounded-lg border border-enel-green/30 bg-enel-green/5 p-4 text-sm">
        <div className="font-semibold text-enel-greenDark mb-2">Argomenti da usare con il cliente</div>
        <ul className="space-y-1.5 text-enel-ink/80 list-disc list-inside">
          {punti.map((p) => (
            <li key={p.id}>{p.testo}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-enel-amber/40 bg-enel-amber/5 p-4 text-sm">
      <div className="font-semibold text-enel-amber mb-2">Il prezzo del concorrente risulta più basso — argomenti di supporto</div>
      <ul className="space-y-1.5 text-enel-ink/80 list-disc list-inside">
        {punti.map((p) => (
          <li key={p.id}>{p.testo}</li>
        ))}
      </ul>
      <div className="text-xs text-enel-ink/50 mt-3">
        Modifica questi testi dalla pagina "Dati e parametri" → Argomentario.
      </div>
    </div>
  );
}
