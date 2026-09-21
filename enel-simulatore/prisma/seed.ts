/**
 * Seed da riga di comando (usato solo se lavori in locale con Node.js).
 * Se invece segui il percorso "senza terminale" via Vercel, usa
 * l'endpoint /api/seed descritto nel README: fa la stessa cosa da browser.
 */
import { PrismaClient } from '@prisma/client';
import { OFFERTE_SEED, PARAMETRI_SEED, ARGOMENTI_SEED } from '../lib/seedData';

const prisma = new PrismaClient();

async function main() {
  await prisma.offerta.deleteMany();
  await prisma.parametroDettaglio.deleteMany();
  await prisma.argomentoVendita.deleteMany();
  await prisma.offerta.createMany({ data: OFFERTE_SEED });
  await prisma.parametroDettaglio.createMany({ data: PARAMETRI_SEED });
  await prisma.argomentoVendita.createMany({ data: ARGOMENTI_SEED });
  console.log('Seed completato: offerte, parametri e argomenti caricati.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
