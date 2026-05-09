"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = signOut;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const lib_1 = require("../lib");
async function signOut() {
    (0, headers_1.cookies)().delete(lib_1.SESSION_COOKIE);
    (0, headers_1.cookies)().delete(lib_1.USERNAME_COOKIE);
    (0, navigation_1.redirect)('/signin');
}
//# sourceMappingURL=actions.js.map