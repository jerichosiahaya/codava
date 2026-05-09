"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.authenticate = authenticate;
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://codava:codava@localhost:5432/codava',
});
async function authenticate(apiKey) {
    const r = await exports.pool.query('SELECT id, username FROM users WHERE api_key = $1', [apiKey]);
    return r.rows[0] ?? null;
}
//# sourceMappingURL=db.js.map