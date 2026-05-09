"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = Me;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const link_1 = require("next/link");
const lib_1 = require("../lib");
const actions_1 = require("./actions");
exports.dynamic = 'force-dynamic';
function Me() {
    const apiKey = (0, headers_1.cookies)().get(lib_1.SESSION_COOKIE)?.value;
    const username = (0, headers_1.cookies)().get(lib_1.USERNAME_COOKIE)?.value;
    if (!apiKey)
        (0, navigation_1.redirect)('/signin');
    return (<div className="container">
      <h1>
        <span className="handle">@{username}</span>
      </h1>
      <p className="empty">
        <link_1.default href="/">Dashboard</link_1.default> · <link_1.default href={`/u/${username}`}>Public profile</link_1.default>
      </p>

      <h2>Your API key</h2>
      <p className="empty">Paste this into VS Code → Settings → Codava: API Key. Keep it secret — anyone with it can submit heartbeats as you.</p>
      <div className="api-key">{apiKey}</div>

      <h2>Sign out</h2>
      <form action={actions_1.signOut}>
        <button className="button" type="submit">Sign out</button>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map