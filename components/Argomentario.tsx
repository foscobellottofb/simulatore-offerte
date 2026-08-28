'use client';

/**
 * Argomenti di supporto per il consulente durante il confronto con un'offerta
 * concorrente. Sono punti generali e volutamente prudenti — non fanno
 * riferimento a promozioni o programmi fedeltà specifici con importi precisi,
 * perché quelli cambiano nel tempo e vanno verificati con la rete commerciale
 * prima di essere usati con un cliente. Personalizza pure i testi qui sotto.
 */

export function Argomentario({
  enelVince,
  tipoPrezzoConcorrente
}: {
  enelVince: boolean;
  tipoPrezzoConcorrente: 'FISSO' | 'VARIABILE';
}) {
  if (enelVince) {
    return (
      <div className="rounded-lg border border-enel-green/30 bg-enel-green/5 p-4 text-sm">
        <div className="font-semibold text-enel-greenDark mb-2">Argomenti da usare con il cliente</div>
        <ul className="space-y-1.5 text-enel-ink/80 list-disc list-inside">
          <li>Il prezzo Enel è già più conveniente su questi consumi: si può chiudere facendo leva sul risparmio immediato, senza bisogno di altre leve.</li>
          <li>Nessuna interruzione di fornitura nel passaggio: gestito interamente da Enel.</li>
          <li>Un unico interlocutore per assistenza, fatturazione ed eventuali reclami.</li>
        </ul>
      </div>
    );
  }

  const punti: string[] = [];

  if (tipoPrezzoConcorrente === 'VARIABILE') {
    punti.push(
      "Il prezzo del concorrente è variabile: può salire con l'andamento del mercato energetico. Un'offerta Enel a prezzo fisso protegge il cliente da rincari imprevisti in un contesto di mercato ancora incerto."
    );
  } else {
    punti.push(
      'A parità di condizioni contrattuali, fai leva sul valore di affidarsi a un fornitore storico con presenza capillare sul territorio, invece che sul solo prezzo.'
    );
  }

  punti.push(
    'Rete di assistenza Spazio Enel diffusa sul territorio, oltre al canale telefonico dedicato Business.',
    'Un solo fornitore per luce e gas semplifica gestione, fatturazione e assistenza.',
    'Verifica se sono attive promozioni o vantaggi dedicati ai clienti Enel Business per questo periodo (non inclusi in questo calcolo).',
    'Solidità di un operatore storico: minore rischio di disservizi o cambi di condizioni improvvisi.'
  );

  return (
    <div className="rounded-lg border border-enel-amber/40 bg-enel-amber/5 p-4 text-sm">
      <div className="font-semibold text-enel-amber mb-2">Il prezzo del concorrente risulta più basso — argomenti di supporto</div>
      <ul className="space-y-1.5 text-enel-ink/80 list-disc list-inside">
        {punti.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <div className="text-xs text-enel-ink/50 mt-3">
        Punti generali da adattare al cliente specifico — verifica sempre le promozioni e i programmi fedeltà
        attualmente attivi presso la tua rete commerciale prima di citarli.
      </div>
    </div>
  );
}
