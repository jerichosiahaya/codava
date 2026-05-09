import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, USERNAME_COOKIE } from '../../lib';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  const username = req.nextUrl.searchParams.get('username');
  if (!key || !username) {
    return NextResponse.redirect(new URL('/signin?error=missing_params', req.url));
  }
  const res = NextResponse.redirect(new URL('/me', req.url));
  const opts = { path: '/', sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 365 };
  res.cookies.set(SESSION_COOKIE, key, { ...opts, httpOnly: true });
  res.cookies.set(USERNAME_COOKIE, username, { ...opts, httpOnly: false });
  return res;
}
