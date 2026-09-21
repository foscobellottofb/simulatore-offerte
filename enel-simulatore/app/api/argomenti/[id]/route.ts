import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const argomento = await prisma.argomentoVendita.update({ where: { id: params.id }, data: body });
  return NextResponse.json(argomento);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.argomentoVendita.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
