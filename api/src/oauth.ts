import * as crypto from 'crypto';
import { pool } from './db';

const GH_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GH_TOKEN = 'https://github.com/login/oauth/access_token';
const GH_USER = 'https://api.github.com/user';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  webUrl: string;
}

export function loadConfig(): OAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:4000';
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, callbackUrl: `${baseUrl}/auth/github/callback`, webUrl };
}

export function authorizeUrl(cfg: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.callbackUrl,
    scope: 'read:user',
    state,
  });
  return `${GH_AUTHORIZE}?${params.toString()}`;
}

export async function exchangeCode(cfg: OAuthConfig, code: string): Promise<string> {
  const res = await fetch(GH_TOKEN, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.callbackUrl,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error ?? 'no_access_token');
  return data.access_token;
}

interface GhUser {
  id: number;
  login: string;
  avatar_url: string;
}

export async function fetchGithubUser(token: string): Promise<GhUser> {
  const res = await fetch(GH_USER, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'codava' },
  });
  if (!res.ok) throw new Error(`github_user ${res.status}`);
  return res.json() as Promise<GhUser>;
}

export async function upsertUser(gh: GhUser): Promise<{ id: number; username: string; api_key: string }> {
  const existing = await pool.query(
    'SELECT id, username, api_key FROM users WHERE github_id = $1',
    [gh.id],
  );
  if (existing.rows[0]) {
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [gh.avatar_url, existing.rows[0].id]);
    return existing.rows[0];
  }
  const apiKey = crypto.randomBytes(32).toString('hex');
  const username = await uniqueUsername(gh.login);
  const inserted = await pool.query(
    `INSERT INTO users (username, github_id, avatar_url, api_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, api_key`,
    [username, gh.id, gh.avatar_url, apiKey],
  );
  return inserted.rows[0];
}

async function uniqueUsername(base: string): Promise<string> {
  const sanitized = base.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'user';
  let candidate = sanitized;
  let i = 1;
  while (true) {
    const r = await pool.query('SELECT 1 FROM users WHERE username = $1', [candidate]);
    if (r.rowCount === 0) return candidate;
    i += 1;
    candidate = `${sanitized}${i}`;
  }
}
