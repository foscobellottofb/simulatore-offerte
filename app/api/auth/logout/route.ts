import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  // Cancella anche il cookie del vecchio login Admin, se ancora presente
  res.cookies.set('enel_admin_session', '', { path: '/', maxAge: 0 });
  return res;
}
