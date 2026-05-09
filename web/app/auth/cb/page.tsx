import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, USERNAME_COOKIE } from '../../lib';

interface Props {
  searchParams: { key?: string; username?: string };
}

export default function Callback({ searchParams }: Props) {
  const { key, username } = searchParams;
  if (!key || !username) {
    return (
      <div className="container">
        <h1>Sign-in failed</h1>
        <p className="empty">Missing credentials in callback. Try signing in again.</p>
      </div>
    );
  }
  const jar = cookies();
  const opts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 };
  jar.set(SESSION_COOKIE, key, opts);
  jar.set(USERNAME_COOKIE, username, { ...opts, httpOnly: false });
  redirect('/me');
}
