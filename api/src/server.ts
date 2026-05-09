import Fastify from 'fastify';
import { pool, authenticate } from './db';

const app = Fastify({ logger: true });

interface HeartbeatIn {
  ts: string;
  language: string;
  project: string;
  file: string;
  is_write?: boolean;
}

app.addHook('onRequest', async (req, reply) => {
  if (req.url === '/health') return;
  if (req.url.startsWith('/u/')) return;
  const header = req.headers['authorization'];
  const key = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!key) return reply.code(401).send({ error: 'missing_api_key' });
  const user = await authenticate(key);
  if (!user) return reply.code(401).send({ error: 'invalid_api_key' });
  (req as any).user = user;
});

app.get('/health', async () => ({ ok: true }));

app.post('/heartbeats', async (req, reply) => {
  const user = (req as any).user as { id: number };
  const body = req.body as { heartbeats?: HeartbeatIn[] };
  const beats = body?.heartbeats ?? [];
  if (!Array.isArray(beats) || beats.length === 0) return { accepted: 0 };
  if (beats.length > 1000) return reply.code(413).send({ error: 'too_many' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const b of beats) {
      await client.query(
        'INSERT INTO heartbeats (user_id, ts, language, project, file, is_write) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, b.ts, b.language ?? 'unknown', b.project ?? 'unknown', b.file ?? 'unknown', b.is_write ?? false],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { accepted: beats.length };
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

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
