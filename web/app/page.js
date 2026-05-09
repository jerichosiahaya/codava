"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = Page;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const link_1 = require("next/link");
const lib_1 = require("./lib");
const Heatmap_1 = require("./Heatmap");
exports.dynamic = 'force-dynamic';
async function Page() {
    const apiKey = (0, headers_1.cookies)().get(lib_1.SESSION_COOKIE)?.value;
    if (!apiKey)
        (0, navigation_1.redirect)('/signin');
    let data;
    try {
        data = await (0, lib_1.fetchSummary)(apiKey);
    }
    catch (e) {
        return (<div className="container">
        <h1>Codava</h1>
        <p className="empty">API unreachable. Is the server running on {process.env.CODAVA_API_URL}?</p>
      </div>);
    }
    const langMax = Math.max(1, ...data.by_language.map((l) => l.seconds));
    const projMax = Math.max(1, ...data.by_project.map((p) => p.seconds));
    return (<div className="container">
      <h1>
        <span className="handle">@{data.username}</span>
      </h1>
      <p className="empty">
        <link_1.default href={`/u/${data.username}`}>Public profile</link_1.default> · <link_1.default href="/me">Settings & API key</link_1.default>
      </p>

      <div className="stats">
        <div className="stat">
          <div className="label">Today</div>
          <div className="value">{(0, lib_1.formatDuration)(data.today_seconds)}</div>
        </div>
        <div className="stat">
          <div className="label">All time</div>
          <div className="value">{(0, lib_1.formatDuration)(data.total_seconds)}</div>
        </div>
        <div className="stat">
          <div className="label">Active days</div>
          <div className="value">{data.days.length}</div>
        </div>
      </div>

      <h2>Last 6 months</h2>
      {data.days.length === 0 ? (<p className="empty">No activity yet. Type some code in VS Code with the extension running.</p>) : (<Heatmap_1.Heatmap days={data.days}/>)}

      <h2>Languages</h2>
      {data.by_language.length === 0 ? (<p className="empty">No data.</p>) : (data.by_language.map((l) => (<div className="bar-row" key={l.language}>
            <div className="name">{l.language}</div>
            <div className="bar">
              <div style={{ width: `${(l.seconds / langMax) * 100}%` }}/>
            </div>
            <div className="val">{(0, lib_1.formatDuration)(l.seconds)}</div>
          </div>)))}

      <h2>Projects</h2>
      {data.by_project.length === 0 ? (<p className="empty">No data.</p>) : (data.by_project.map((p) => (<div className="bar-row" key={p.project}>
            <div className="name">{p.project}</div>
            <div className="bar">
              <div style={{ width: `${(p.seconds / projMax) * 100}%` }}/>
            </div>
            <div className="val">{(0, lib_1.formatDuration)(p.seconds)}</div>
          </div>)))}
    </div>);
}
//# sourceMappingURL=page.js.map