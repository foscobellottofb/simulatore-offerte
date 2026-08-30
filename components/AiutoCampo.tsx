'use client';

import { useState } from 'react';

// Piccolo "?" da mettere accanto a un'etichetta di campo: al click mostra una
// spiegazione breve senza occupare spazio permanente nella pagina. Pensato
// per essere poco invadente — un puntino discreto, non un box sempre aperto.
export function AiutoCampo({ testo }: { testo: string }) {
  const [aperto, setAperto] = useState(false);

  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        onBlur={() => setTimeout(() => setAperto(false), 150)}
        aria-label="Aiuto su questo campo"
        className="w-3.5 h-3.5 rounded-full border border-enel-ink/25 text-enel-ink/40 text-[9px] leading-none inline-flex items-center justify-center hover:border-enel-navy hover:text-enel-navy normal-case tracking-normal font-normal"
      >
        ?
      </button>
      {aperto && (
        <span className="absolute z-30 left-0 top-5 w-60 bg-white border border-enel-line rounded-lg shadow-lg p-2.5 text-[11px] leading-snug font-normal text-enel-ink/70 normal-case tracking-normal">
          {testo}
        </span>
      )}
    </span>
  );
}
