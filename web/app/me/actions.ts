'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, USERNAME_COOKIE } from '../lib';

export async function signOut() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(USERNAME_COOKIE);
  redirect('/signin');
}
