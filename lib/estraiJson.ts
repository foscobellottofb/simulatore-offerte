/**
 * Estrae un oggetto JSON dalla risposta testuale di Claude, tollerando frasi
 * di contorno che il modello a volte aggiunge nonostante le istruzioni di
 * rispondere solo con JSON (più frequente quando usa strumenti come la
 * ricerca web: es. "Ecco cosa ho trovato: {...}"). Prende la sottostringa
 * tra la prima "{" e l'ultima "}" del testo, invece di richiedere che
 * l'intera risposta sia già JSON puro.
 */
export function estraiJson<T = any>(testo: string): T {
  const pulito = testo.replace(/```json|```/g, '').trim();
  const inizio = pulito.indexOf('{');
  const fine = pulito.lastIndexOf('}');
  const candidato = inizio !== -1 && fine !== -1 && fine > inizio ? pulito.slice(inizio, fine + 1) : pulito;
  return JSON.parse(candidato);
}
