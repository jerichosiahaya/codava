import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import * as crypto from 'crypto';
import { pool, authenticate } from './db';
import { loadConfig, authorizeUrl, exchangeCode, fetchGithubUser, upsertUser } from './oauth';

const app = Fastify({ logger: true });

const HeartbeatSchema = z.object({
  ts: z.string().datetime(),
  language: z.string().min(1).max(64),
  project: z.string().min(1).max(128),
  file: z.string().min(1).max(256),
  is_write: z.boolean().optional(),
});
const HeartbeatBatchSchema = z.object({
  heartbeats: z.array(HeartbeatSchema).min(1).max(500),
});

const TS_PAST_WINDOW_MS = 10 * 60 * 1000;
const TS_FUTURE_WINDOW_MS = 60 * 1000;

const oauthStates = new Map<string, number>();
function rememberState(s: string): void {
  oauthStates.set(s, Date.now());
  for (const [k, t] of oauthStates) if (Date.now() - t > 10 * 60 * 1000) oauthStates.delete(k);
}
function consumeState(s: string): boolean {
  if (!oauthStates.has(s)) return false;
  oauthStates.delete(s);
  return true;
}

app.register(rateLimit, {
  global: false,
  keyGenerator: (req) => {
    const u = (req as any).user as { id: number } | undefined;
    return u ? `u:${u.id}` : `ip:${req.ip}`;
  },
});

app.addHook('onRequest', async (req, reply) => {
  if (req.url === '/health') return;
  if (req.url.startsWith('/u/')) return;
  if (req.url.startsWith('/auth/')) return;
  const header = req.headers['authorization'];
  const key = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!key) return reply.code(401).send({ error: 'missing_api_key' });
  const user = await authenticate(key);
  if (!user) return reply.code(401).send({ error: 'invalid_api_key' });
  (req as any).user = user;
});

app.get('/health', async () => ({ ok: true }));

app.post(
  '/heartbeats',
  { config: { rateLimit: { max: 200, timeWindow: '1 minute' } } },
  async (req, reply) => {
    const user = (req as any).user as { id: number };
    const parsed = HeartbeatBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
    }

    const now = Date.now();
    const accepted: typeof parsed.data.heartbeats = [];
    let rejected = 0;
    for (const b of parsed.data.heartbeats) {
      const t = Date.parse(b.ts);
      if (now - t > TS_PAST_WINDOW_MS || t - now > TS_FUTURE_WINDOW_MS) {
        rejected += 1;
        continue;
      }
      accepted.push(b);
    }
    if (accepted.length === 0) return { accepted: 0, rejected };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const b of accepted) {
        await client.query(
          'INSERT INTO heartbeats (user_id, ts, language, project, file, is_write) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, b.ts, b.language, b.project, b.file, b.is_write ?? false],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return { accepted: accepted.length, rejected };
  },
);

app.delete('/me', async (req, reply) => {
  const user = (req as any).user as { id: number };
  await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  return reply.code(200).send({ deleted: true });
});

app.get('/me/stats/today', async (req) => {
  const user = (req as any).user as { id: number };
  const r = await pool.query(
    `SELECT
       COALESCE(SUM(seconds), 0)::int AS total_seconds,
       COALESCE(jsonb_object_agg(language, seconds) FILTER (WHERE language IS NOT NULL), '{}') AS by_language
     FROM (
       SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats
       WHERE user_id = $1 AND ts::date = CURRENT_DATE
       GROUP BY language
     ) s`,
    [user.id],
  );
  return r.rows[0];
});

app.get('/me/stats/summary', async (req) => {
  const user = (req as any).user as { id: number; username: string };
  const [totals, byLang, byProj, days] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) * 30 AS total_seconds,
              COUNT(*) FILTER (WHERE ts::date = CURRENT_DATE) * 30 AS today_seconds
       FROM heartbeats WHERE user_id = $1`,
      [user.id],
    ),
    pool.query(
      `SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY language ORDER BY seconds DESC LIMIT 10`,
      [user.id],
    ),
    pool.query(
      `SELECT project, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY project ORDER BY seconds DESC LIMIT 10`,
      [user.id],
    ),
    pool.query(
      `SELECT ts::date AS day, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1 AND ts > now() - interval '180 days'
       GROUP BY ts::date ORDER BY day`,
      [user.id],
    ),
  ]);
  return {
    username: user.username,
    total_seconds: Number(totals.rows[0].total_seconds),
    today_seconds: Number(totals.rows[0].today_seconds),
    by_language: byLang.rows.map((r) => ({ language: r.language, seconds: Number(r.seconds) })),
    by_project: byProj.rows.map((r) => ({ project: r.project, seconds: Number(r.seconds) })),
    days: days.rows.map((r) => ({ day: r.day, seconds: Number(r.seconds) })),
  };
});

app.get('/me/stats/days', async (req) => {
  const user = (req as any).user as { id: number };
  const r = await pool.query(
    `SELECT ts::date AS day, COUNT(*) * 30 AS total_seconds
     FROM heartbeats
     WHERE user_id = $1
     GROUP BY ts::date
     ORDER BY day DESC
     LIMIT 60`,
    [user.id],
  );
  return r.rows;
});

app.get<{ Params: { username: string } }>('/u/:username', async (req, reply) => {
  const { username } = req.params;
  const userRow = await pool.query('SELECT id, username FROM users WHERE username = $1', [username]);
  const user = userRow.rows[0];
  if (!user) return reply.code(404).send({ error: 'not_found' });

  const [totals, byLang, days] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) * 30 AS total_seconds,
              COUNT(*) FILTER (WHERE ts::date = CURRENT_DATE) * 30 AS today_seconds
       FROM heartbeats WHERE user_id = $1`,
      [user.id],
    ),
    pool.query(
      `SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY language ORDER BY seconds DESC LIMIT 10`,
      [user.id],
    ),
    pool.query(
      `SELECT ts::date AS day, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1 AND ts > now() - interval '180 days'
       GROUP BY ts::date ORDER BY day`,
      [user.id],
    ),
  ]);
  return {
    username: user.username,
    total_seconds: Number(totals.rows[0].total_seconds),
    today_seconds: Number(totals.rows[0].today_seconds),
    by_language: byLang.rows.map((r) => ({ language: r.language, seconds: Number(r.seconds) })),
    days: days.rows.map((r) => ({ day: r.day, seconds: Number(r.seconds) })),
  };
});

app.get('/auth/github/start', async (_req, reply) => {
  const cfg = loadConfig();
  if (!cfg) return reply.code(500).send({ error: 'oauth_not_configured' });
  const state = crypto.randomBytes(16).toString('hex');
  rememberState(state);
  return reply.redirect(authorizeUrl(cfg, state));
});

app.get<{ Querystring: { code?: string; state?: string } }>('/auth/github/callback', async (req, reply) => {
  const cfg = loadConfig();
  if (!cfg) return reply.code(500).send({ error: 'oauth_not_configured' });
  const { code, state } = req.query;
  if (!code || !state) return reply.code(400).send({ error: 'missing_params' });
  if (!consumeState(state)) return reply.code(400).send({ error: 'invalid_state' });
  try {
    const token = await exchangeCode(cfg, code);
    const gh = await fetchGithubUser(token);
    const user = await upsertUser(gh);
    const dest = new URL('/auth/cb', cfg.webUrl);
    dest.searchParams.set('key', user.api_key);
    dest.searchParams.set('username', user.username);
    return reply.redirect(dest.toString());
  } catch (e) {
    app.log.error(e);
    return reply.code(500).send({ error: 'oauth_failed' });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
