"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USERNAME_COOKIE = exports.SESSION_COOKIE = void 0;
exports.fetchPublicProfile = fetchPublicProfile;
exports.apiBase = apiBase;
exports.fetchSummary = fetchSummary;
exports.formatDuration = formatDuration;
async function fetchPublicProfile(username) {
    const url = process.env.CODAVA_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${url}/u/${encodeURIComponent(username)}`, { cache: 'no-store' });
    if (res.status === 404)
        return null;
    if (!res.ok)
        throw new Error(`api ${res.status}`);
    return res.json();
}
exports.SESSION_COOKIE = 'codava_key';
exports.USERNAME_COOKIE = 'codava_user';
function apiBase() {
    return process.env.CODAVA_API_URL ?? 'http://localhost:4000';
}
async function fetchSummary(apiKey) {
    const res = await fetch(`${apiBase()}/me/stats/summary`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
    });
    if (!res.ok)
        throw new Error(`api ${res.status}`);
    return res.json();
}
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0)
        return `${h}h ${m}m`;
    return `${m}m`;
}
//# sourceMappingURL=lib.js.map