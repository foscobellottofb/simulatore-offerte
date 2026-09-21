import { FasciaRete } from './types';

/**
 * Tariffe regolate ARERA per l'energia elettrica: distribuzione + oneri
 * ASOS/ARIM per fascia di potenza (BTA1..BTA6), trasmissione, misura e
 * accisa.
 *
 * Dal 2026-08 queste componenti sono editabili da Admin → "Rete e oneri"
 * (tabella FasciaRete) e da Admin → "Parametri di dettaglio" (trasmissione,
 * misura, accisa): questo file NON contiene più i valori "veri", solo un
 * fallback di sicurezza usato se il database non è ancora stato seminato o
 * se una fascia risultasse mancante, così il simulatore non si rompe mai.
 * Per aggiornare le tariffe (es. nuovo trimestre ASOS/ARIM) usa l'interfaccia
 * Admin, non questo file.
 */

export const FASCE_DEFAULT: FasciaRete[] = [
  {
    id: 'default-bta1', commodity: 'LUCE', fascia: 'BTA1', etichetta: 'Potenza impegnata ≤ 1,5 kW', minKw: 0, maxKw: 1.5, ordinamento: 1,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 32.9297, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.8164, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.4524, arimEnergiaKwh: 0.001616
  },
  {
    id: 'default-bta2', commodity: 'LUCE', fascia: 'BTA2', etichetta: 'Potenza > 1,5 e ≤ 3 kW', minKw: 1.5, maxKw: 3, ordinamento: 2,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 31.1874, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.0328, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.27, arimEnergiaKwh: 0.001616
  },
  {
    id: 'default-bta3', commodity: 'LUCE', fascia: 'BTA3', etichetta: 'Potenza > 3 e ≤ 6 kW', minKw: 3, maxKw: 6, ordinamento: 3,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    id: 'default-bta4', commodity: 'LUCE', fascia: 'BTA4', etichetta: 'Potenza > 6 e ≤ 10 kW', minKw: 6, maxKw: 10, ordinamento: 4,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    id: 'default-bta5', commodity: 'LUCE', fascia: 'BTA5', etichetta: 'Potenza > 10 kW', minKw: 10, maxKw: null, ordinamento: 5,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    id: 'default-bta6', commodity: 'LUCE', fascia: 'BTA6', etichetta: 'Potenza disponibile > 16,5 kW', minKw: 16.5, maxKw: null, ordinamento: 6,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 32.9297, distribuzioneEnergiaKwh: 0.00066,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.8164, asosEnergiaKwh: 0.031875,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.4524, arimEnergiaKwh: 0.001614
  }
];

// Fallback per trasmissione/misura/accisa se i "Parametri di dettaglio" non sono
// ancora stati caricati (stessi valori del seed, vedi lib/seedData.ts).
export const TRASMISSIONE_KWH_DEFAULT = 0.0119; // €/kWh
export const MISURA_ANNO_DEFAULT = 19.6826; // €/POD/anno
export const ACCISA_LUCE_KWH_DEFAULT = 0.0125; // €/kWh

export function trovaFasciaPotenza(potenzaKw: number, fasce: FasciaRete[] = FASCE_DEFAULT): FasciaRete {
  const elenco = fasce.length > 0 ? fasce : FASCE_DEFAULT;
  // BTA6 (potenza disponibile) non è selezionabile automaticamente dall'input
  // attuale del simulatore (potenza impegnata, max 25 kW): resta nell'elenco
  // solo per essere editabile/visibile in Admin.
  const selezionabili = elenco.filter((f) => f.fascia !== 'BTA6');
  return (
    selezionabili.find((f) => (potenzaKw > f.minKw ? potenzaKw <= (f.maxKw ?? Infinity) : potenzaKw === 0 && f.minKw === 0)) ??
    selezionabili[0] ??
    FASCE_DEFAULT[0]
  );
}

/**
 * Componenti "rete + oneri di sistema" (distribuzione + trasmissione + misura
 * + ASOS + ARIM), su base annua. L'accisa è tenuta separata perché è una voce
 * fiscale a sé, mostrata come riga distinta nel dettaglio bolletta.
 */
export function calcolaCostiRete(
  potenzaKw: number,
  fasce: FasciaRete[] = FASCE_DEFAULT,
  trasmissioneKwh: number = TRASMISSIONE_KWH_DEFAULT,
  misuraAnno: number = MISURA_ANNO_DEFAULT
) {
  const f = trovaFasciaPotenza(potenzaKw, fasce);
  return {
    fascia: f.fascia,
    fissaAnno: f.distribuzioneFissaAnno + misuraAnno + f.asosFissaAnno + f.arimFissaAnno,
    potenzaAnnoPerKw: f.distribuzionePotenzaAnno + f.asosPotenzaAnno + f.arimPotenzaAnno,
    energiaKwh: f.distribuzioneEnergiaKwh + trasmissioneKwh + f.asosEnergiaKwh + f.arimEnergiaKwh
  };
}
