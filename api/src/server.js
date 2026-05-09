"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const crypto = require("crypto");
const db_1 = require("./db");
const oauth_1 = require("./oauth");
const app = (0, fastify_1.default)({ logger: true });
const oauthStates = new Map();
function rememberState(s) {
    oauthStates.set(s, Date.now());
    for (const [k, t] of oauthStates)
        if (Date.now() - t > 10 * 60 * 1000)
            oauthStates.delete(k);
}
function consumeState(s) {
    if (!oauthStates.has(s))
        return false;
    oauthStates.delete(s);
    return true;
}
app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health')
        return;
    if (req.url.startsWith('/u/'))
        return;
    if (req.url.startsWith('/auth/'))
        return;
    const header = req.headers['authorization'];
    const key = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!key)
        return reply.code(401).send({ error: 'missing_api_key' });
    const user = await (0, db_1.authenticate)(key);
    if (!user)
        return reply.code(401).send({ error: 'invalid_api_key' });
    req.user = user;
});
app.get('/health', async () => ({ ok: true }));
app.post('/heartbeats', async (req, reply) => {
    const user = req.user;
    const body = req.body;
    const beats = body?.heartbeats ?? [];
    if (!Array.isArray(beats) || beats.length === 0)
        return { accepted: 0 };
    if (beats.length > 1000)
        return reply.code(413).send({ error: 'too_many' });
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        for (const b of beats) {
            await client.query('INSERT INTO heartbeats (user_id, ts, language, project, file, is_write) VALUES ($1, $2, $3, $4, $5, $6)', [user.id, b.ts, b.language ?? 'unknown', b.project ?? 'unknown', b.file ?? 'unknown', b.is_write ?? false]);
        }
        await client.query('COMMIT');
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
    return { accepted: beats.length };
});
app.get('/me/stats/today', async (req) => {
    const user = req.user;
    const r = await db_1.pool.query(`SELECT
       COALESCE(SUM(seconds), 0)::int AS total_seconds,
       COALESCE(jsonb_object_agg(language, seconds) FILTER (WHERE language IS NOT NULL), '{}') AS by_language
     FROM (
       SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats
       WHERE user_id = $1 AND ts::date = CURRENT_DATE
       GROUP BY language
     ) s`, [user.id]);
    return r.rows[0];
});
app.get('/me/stats/summary', async (req) => {
    const user = req.user;
    const [totals, byLang, byProj, days] = await Promise.all([
        db_1.pool.query(`SELECT COUNT(*) * 30 AS total_seconds,
              COUNT(*) FILTER (WHERE ts::date = CURRENT_DATE) * 30 AS today_seconds
       FROM heartbeats WHERE user_id = $1`, [user.id]),
        db_1.pool.query(`SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY language ORDER BY seconds DESC LIMIT 10`, [user.id]),
        db_1.pool.query(`SELECT project, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY project ORDER BY seconds DESC LIMIT 10`, [user.id]),
        db_1.pool.query(`SELECT ts::date AS day, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1 AND ts > now() - interval '180 days'
       GROUP BY ts::date ORDER BY day`, [user.id]),
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
    const user = req.user;
    const r = await db_1.pool.query(`SELECT ts::date AS day, COUNT(*) * 30 AS total_seconds
     FROM heartbeats
     WHERE user_id = $1
     GROUP BY ts::date
     ORDER BY day DESC
     LIMIT 60`, [user.id]);
    return r.rows;
});
app.get('/u/:username', async (req, reply) => {
    const { username } = req.params;
    const userRow = await db_1.pool.query('SELECT id, username FROM users WHERE username = $1', [username]);
    const user = userRow.rows[0];
    if (!user)
        return reply.code(404).send({ error: 'not_found' });
    const [totals, byLang, days] = await Promise.all([
        db_1.pool.query(`SELECT COUNT(*) * 30 AS total_seconds,
              COUNT(*) FILTER (WHERE ts::date = CURRENT_DATE) * 30 AS today_seconds
       FROM heartbeats WHERE user_id = $1`, [user.id]),
        db_1.pool.query(`SELECT language, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1
       GROUP BY language ORDER BY seconds DESC LIMIT 10`, [user.id]),
        db_1.pool.query(`SELECT ts::date AS day, COUNT(*) * 30 AS seconds
       FROM heartbeats WHERE user_id = $1 AND ts > now() - interval '180 days'
       GROUP BY ts::date ORDER BY day`, [user.id]),
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
    const cfg = (0, oauth_1.loadConfig)();
    if (!cfg)
        return reply.code(500).send({ error: 'oauth_not_configured' });
    const state = crypto.randomBytes(16).toString('hex');
    rememberState(state);
    return reply.redirect((0, oauth_1.authorizeUrl)(cfg, state));
});
app.get('/auth/github/callback', async (req, reply) => {
    const cfg = (0, oauth_1.loadConfig)();
    if (!cfg)
        return reply.code(500).send({ error: 'oauth_not_configured' });
    const { code, state } = req.query;
    if (!code || !state)
        return reply.code(400).send({ error: 'missing_params' });
    if (!consumeState(state))
        return reply.code(400).send({ error: 'invalid_state' });
    try {
        const token = await (0, oauth_1.exchangeCode)(cfg, code);
        const gh = await (0, oauth_1.fetchGithubUser)(token);
        const user = await (0, oauth_1.upsertUser)(gh);
        const dest = new URL('/auth/cb', cfg.webUrl);
        dest.searchParams.set('key', user.api_key);
        dest.searchParams.set('username', user.username);
        return reply.redirect(dest.toString());
    }
    catch (e) {
        app.log.error(e);
        return reply.code(500).send({ error: 'oauth_failed' });
    }
});
const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
    app.log.error(e);
    process.exit(1);
});
//# sourceMappingURL=server.js.map