/**
 * Salva/legge un gruppo di campi in localStorage, per farli sopravvivere
 * alla navigazione tra pagine (Simulatore <-> Confronto concorrenza sono
 * componenti React separati: ogni volta che si cambia pagina, il
 * componente precedente si smonta e il suo stato interno si perde a meno
 * di conservarlo altrove). localStorage invece di sessionStorage perché
 * sopravvive anche aprendo le pagine in schede diverse.
 */
export function leggiPersistito<T extends Record<string, any>>(chiave: string): Partial<T> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(chiave) || '{}');
  } catch {
    return {};
  }
}

export function scriviPersistito(chiave: string, valori: Record<string, any>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(chiave, JSON.stringify(valori));
}
