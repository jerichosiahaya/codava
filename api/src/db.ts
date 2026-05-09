import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://codava:codava@localhost:5432/codava',
});

export async function authenticate(apiKey: string): Promise<{ id: number; username: string } | null> {
  const r = await pool.query('SELECT id, username FROM users WHERE api_key = $1', [apiKey]);
  return r.rows[0] ?? null;
}
