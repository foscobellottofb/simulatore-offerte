/**
 * Tariffe regolate ARERA per l'energia elettrica, valide per il 2026.
 * Fonte: foglio "Parametri simulatore" del file CTE_Enel_SMB_import_SharePoint.xlsx.
 *
 * Queste NON sono tariffe commerciali Enel ma componenti regolate uguali per
 * tutti i fornitori (distribuzione, trasmissione, oneri di sistema). Vengono
 * tenute nel codice (non nel database) perché sono dati normativi ARERA
 * aggiornati con delibere trimestrali/annuali, non parametri che la rete
 * commerciale deve poter modificare da interfaccia.
 *
 * ATTENZIONE - DA AGGIORNARE PERIODICAMENTE:
 * - Distribuzione, trasmissione, misura, accisa: validi 01/01/2026-31/12/2026.
 * - Oneri ASOS/ARIM: validi SOLO per il trimestre 01/07/2026-30/09/2026 (cambiano
 *   ogni trimestre con delibera ARERA). Vanno risostituiti a ogni trimestre.
 */

export type FasciaPotenza = 'BTA1' | 'BTA2' | 'BTA3' | 'BTA4' | 'BTA5' | 'BTA6';

interface RigaFasciaPotenza {
  fascia: FasciaPotenza;
  minKw: number; // esclusivo, tranne BTA1 che parte da 0 incluso
  maxKw: number; // incluso
  distribuzioneFissaAnno: number; // €/POD/anno
  distribuzionePotenzaAnno: number; // €/kW/anno
  distribuzioneEnergiaKwh: number; // €/kWh
  asosFissaAnno: number; // €/POD/anno (trimestre lug-set 2026)
  asosPotenzaAnno: number; // €/kW/anno
  asosEnergiaKwh: number; // €/kWh
  arimFissaAnno: number; // €/POD/anno
  arimPotenzaAnno: number; // €/kW/anno
  arimEnergiaKwh: number; // €/kWh
}

// BTA6 (potenza disponibile > 16,5 kW) non è raggiungibile con l'input attuale
// del simulatore (che arriva a 25 kW di potenza impegnata, non disponibile),
// quindi non è inclusa nella selezione automatica: viene lasciata qui per
// completezza/riferimento futuro.
const FASCE: RigaFasciaPotenza[] = [
  {
    fascia: 'BTA1', minKw: 0, maxKw: 1.5,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 32.9297, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.8164, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.4524, arimEnergiaKwh: 0.001616
  },
  {
    fascia: 'BTA2', minKw: 1.5, maxKw: 3,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 31.1874, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 14.0328, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.27, arimEnergiaKwh: 0.001616
  },
  {
    fascia: 'BTA3', minKw: 3, maxKw: 6,
    distribuzioneFissaAnno: 5.3471, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 12.9924, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0276, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    fascia: 'BTA4', minKw: 6, maxKw: 10,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  },
  {
    fascia: 'BTA5', minKw: 10, maxKw: Infinity,
    distribuzioneFissaAnno: 5.8818, distribuzionePotenzaAnno: 34.672, distribuzioneEnergiaKwh: 0.00068,
    asosFissaAnno: 13.2336, asosPotenzaAnno: 15.6012, asosEnergiaKwh: 0.031881,
    arimFissaAnno: 3.0828, arimPotenzaAnno: 3.636, arimEnergiaKwh: 0.001616
  }
];

// Componenti indipendenti dalla fascia di potenza
export const TRASMISSIONE_KWH = 0.0119; // €/kWh
export const MISURA_ANNO = 19.6826; // €/POD/anno
export const ACCISA_LUCE_KWH = 0.0125; // €/kWh (aliquota standard, primi 200.000 kWh mensili)

export function trovaFasciaPotenza(potenzaKw: number): RigaFasciaPotenza {
  return FASCE.find((f) => potenzaKw > f.minKw ? potenzaKw <= f.maxKw : potenzaKw === 0 && f.minKw === 0) ?? FASCE[0];
}

/**
 * Componenti "rete + oneri di sistema" (distribuzione + trasmissione + misura
 * + ASOS + ARIM), su base annua. L'accisa è tenuta separata perché è una voce
 * fiscale a sé, mostrata come riga distinta nel dettaglio bolletta.
 */
export function calcolaCostiRete(potenzaKw: number) {
  const f = trovaFasciaPotenza(potenzaKw);
  return {
    fascia: f.fascia,
    fissaAnno: f.distribuzioneFissaAnno + MISURA_ANNO + f.asosFissaAnno + f.arimFissaAnno,
    potenzaAnnoPerKw: f.distribuzionePotenzaAnno + f.asosPotenzaAnno + f.arimPotenzaAnno,
    energiaKwh: f.distribuzioneEnergiaKwh + TRASMISSIONE_KWH + f.asosEnergiaKwh + f.arimEnergiaKwh
  };
}
