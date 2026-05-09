"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const lib_1 = require("../../lib");
async function GET(req) {
    const key = req.nextUrl.searchParams.get('key');
    const username = req.nextUrl.searchParams.get('username');
    if (!key || !username) {
        return server_1.NextResponse.redirect(new URL('/signin?error=missing_params', req.url));
    }
    const res = server_1.NextResponse.redirect(new URL('/me', req.url));
    const opts = { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 };
    res.cookies.set(lib_1.SESSION_COOKIE, key, { ...opts, httpOnly: true });
    res.cookies.set(lib_1.USERNAME_COOKIE, username, { ...opts, httpOnly: false });
    return res;
}
//# sourceMappingURL=route.js.map