import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const offerta = await prisma.offertaConcorrente.update({ where: { id: params.id }, data: body });
  return NextResponse.json(offerta);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.offertaConcorrente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
