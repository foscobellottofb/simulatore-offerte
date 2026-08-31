const MESI_LABEL = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// Palette stabile: l'anno più recente in verde Enel (per farlo risaltare),
// gli anni precedenti in grigi/blu neutri, come nel grafico GME di riferimento.
const COLORI = ['#94A3B8', '#1B3A66', '#00843D', '#E8A33D'];

export interface SerieAnnoPun {
  anno: number;
  // valore per ciascun mese 1..12, null se il mese non è ancora disponibile
  valori: (number | null)[];
  stimati: boolean[]; // stesso indice di valori: true se il punto è una stima
}

export function PunChart({ serie, decimaliAsse = 0 }: { serie: SerieAnnoPun[]; decimaliAsse?: number }) {
  const W = 760;
  const H = 320;
  const PAD_L = 48;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 32;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const tuttiValori = serie.flatMap((s) => s.valori.filter((v): v is number => v != null));
  const min = Math.min(0, ...tuttiValori) * 0.95;
  const max = Math.max(...tuttiValori, 10) * 1.08;

  const x = (meseIndex: number) => PAD_L + (meseIndex / 11) * plotW;
  const y = (valore: number) => PAD_T + plotH - ((valore - min) / (max - min || 1)) * plotH;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) * i) / yTicks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Andamento del PUN mensile, confronto tra anni">
      {/* griglia orizzontale + etichette asse Y */}
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="#E1E5E2" strokeWidth={1} />
          <text x={PAD_L - 8} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#8B93A0">
            {v.toFixed(decimaliAsse)}
          </text>
        </g>
      ))}

      {/* asse X: mesi */}
      {MESI_LABEL.map((m, i) => (
        <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#8B93A0">
          {m}
        </text>
      ))}

      {/* una polyline per anno, tratteggiata nei tratti stimati */}
      {serie.map((s, si) => {
        const colore = COLORI[si % COLORI.length];
        const punti = s.valori
          .map((v, mi) => (v != null ? { mi, v, stimato: s.stimati[mi] } : null))
          .filter((p): p is { mi: number; v: number; stimato: boolean } => p !== null);

        const segmenti: { x1: number; y1: number; x2: number; y2: number; stimato: boolean }[] = [];
        for (let i = 0; i < punti.length - 1; i++) {
          segmenti.push({
            x1: x(punti[i].mi),
            y1: y(punti[i].v),
            x2: x(punti[i + 1].mi),
            y2: y(punti[i + 1].v),
            stimato: punti[i].stimato || punti[i + 1].stimato
          });
        }

        return (
          <g key={s.anno}>
            {segmenti.map((seg, i) => (
              <line
                key={i}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={colore}
                strokeWidth={2.5}
                strokeDasharray={seg.stimato ? '5 4' : undefined}
                strokeLinecap="round"
              />
            ))}
            {punti.map((p) => (
              <circle key={p.mi} cx={x(p.mi)} cy={y(p.v)} r={p.stimato ? 2.5 : 3.5} fill={p.stimato ? '#fff' : colore} stroke={colore} strokeWidth={p.stimato ? 1.5 : 0} />
            ))}
          </g>
        );
      })}

      {/* legenda anni */}
      {serie.map((s, si) => (
        <g key={s.anno} transform={`translate(${PAD_L + si * 90}, ${PAD_T - 8})`}>
          <line x1={0} y1={0} x2={16} y2={0} stroke={COLORI[si % COLORI.length]} strokeWidth={3} />
          <text x={20} y={3} fontSize={11} fill="#12181B" fontWeight={600}>
            {s.anno}
          </text>
        </g>
      ))}
    </svg>
  );
}
