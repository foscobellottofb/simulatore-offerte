import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const argomenti = await prisma.argomentoVendita.findMany({ orderBy: [{ tipo: 'asc' }, { ordinamento: 'asc' }] });
  return NextResponse.json(argomenti);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const argomento = await prisma.argomentoVendita.create({ data: body });
  return NextResponse.json(argomento, { status: 201 });
}
