import { redirect } from 'next/navigation';

// Il vecchio login dell'Admin (password unica) è stato sostituito dal login
// personale per tutti: chi apre ancora questo indirizzo viene portato lì.
export default function VecchioLoginAdmin() {
  redirect('/login');
}
