"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Signin;
const lib_1 = require("../lib");
function Signin() {
    return (<div className="container">
      <h1>Codava</h1>
      <p className="empty">Strava for coders. Sign in to track your coding time.</p>
      <p style={{ marginTop: '2rem' }}>
        <a href={`${(0, lib_1.apiBase)()}/auth/github/start`} className="button">
          Sign in with GitHub
        </a>
      </p>
    </div>);
}
//# sourceMappingURL=page.js.map