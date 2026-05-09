import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, USERNAME_COOKIE } from '../../lib';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/signin', req.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(USERNAME_COOKIE);
  return res;
}
