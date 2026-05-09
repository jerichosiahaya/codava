import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SESSION_COOKIE, USERNAME_COOKIE } from '../lib';

export const dynamic = 'force-dynamic';

export default function Me() {
  const apiKey = cookies().get(SESSION_COOKIE)?.value;
  const username = cookies().get(USERNAME_COOKIE)?.value;
  if (!apiKey) redirect('/signin');

  return (
    <div className="container">
      <h1>
        <span className="handle">@{username}</span>
      </h1>
      <p className="empty">
        <Link href="/">Dashboard</Link> · <Link href={`/u/${username}`}>Public profile</Link>
      </p>

      <h2>Your API key</h2>
      <p className="empty">Paste this into VS Code → Settings → Codava: API Key. Keep it secret — anyone with it can submit heartbeats as you.</p>
      <div className="api-key">{apiKey}</div>

      <h2>Sign out</h2>
      <form action="/auth/signout" method="post">
        <button className="button" type="submit">Sign out</button>
      </form>
    </div>
  );
}
