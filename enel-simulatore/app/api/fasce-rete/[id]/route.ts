import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// La protezione (solo utenti loggati in Admin) è applicata centralmente in
// middleware.ts, che copre tutti i metodi non-GET su /api/fasce-rete/:path*.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.fasciaRete.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
