export interface Summary {
  username: string;
  total_seconds: number;
  today_seconds: number;
  by_language: { language: string; seconds: number }[];
  by_project: { project: string; seconds: number }[];
  days: { day: string; seconds: number }[];
}

export interface PublicProfile {
  username: string;
  total_seconds: number;
  today_seconds: number;
  by_language: { language: string; seconds: number }[];
  days: { day: string; seconds: number }[];
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const url = process.env.CODAVA_API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${url}/u/${encodeURIComponent(username)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export const SESSION_COOKIE = 'codava_key';
export const USERNAME_COOKIE = 'codava_user';

export function apiBase(): string {
  return process.env.CODAVA_API_URL ?? 'http://localhost:4000';
}

export async function fetchSummary(apiKey: string): Promise<Summary> {
  const res = await fetch(`${apiBase()}/me/stats/summary`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
