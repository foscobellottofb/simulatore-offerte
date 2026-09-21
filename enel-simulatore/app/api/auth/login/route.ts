import { NextRequest, NextResponse } from 'next/server';
import { passwordConfigurata, passwordCorretta, tokenSessione, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!passwordConfigurata()) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD non è impostata su Vercel: aggiungila nelle variabili d\'ambiente del progetto.' },
      { status: 500 }
    );
  }

  const { password } = await req.json();
  if (typeof password !== 'string' || !passwordCorretta(password)) {
    return NextResponse.json({ error: 'Password errata.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await tokenSessione(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14 // 14 giorni
  });
  return res;
}
