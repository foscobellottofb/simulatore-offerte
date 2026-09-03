import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Vedi commento in app/api/fasce-rete/route.ts.
export const dynamic = 'force-dynamic';

export async function GET() {
  const direttive = await prisma.direttivaScript.findMany({ orderBy: { ordinamento: 'asc' } });
  return NextResponse.json(direttive);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const direttiva = await prisma.direttivaScript.create({ data: body });
  return NextResponse.json(direttiva, { status: 201 });
}
