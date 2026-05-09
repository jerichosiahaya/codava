"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.generateMetadata = generateMetadata;
exports.default = PublicProfile;
const navigation_1 = require("next/navigation");
const lib_1 = require("../../lib");
const Heatmap_1 = require("../../Heatmap");
exports.dynamic = 'force-dynamic';
async function generateMetadata({ params }) {
    return { title: `@${params.username} — Codava` };
}
async function PublicProfile({ params }) {
    const data = await (0, lib_1.fetchPublicProfile)(params.username);
    if (!data)
        (0, navigation_1.notFound)();
    const langMax = Math.max(1, ...data.by_language.map((l) => l.seconds));
    return (<div className="container">
      <h1>
        <span className="handle">@{data.username}</span>
      </h1>
      <p className="empty">Public profile</p>

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
      {data.days.length === 0 ? (<p className="empty">No activity yet.</p>) : (<Heatmap_1.Heatmap days={data.days}/>)}

      <h2>Languages</h2>
      {data.by_language.length === 0 ? (<p className="empty">No data.</p>) : (data.by_language.map((l) => (<div className="bar-row" key={l.language}>
            <div className="name">{l.language}</div>
            <div className="bar">
              <div style={{ width: `${(l.seconds / langMax) * 100}%` }}/>
            </div>
            <div className="val">{(0, lib_1.formatDuration)(l.seconds)}</div>
          </div>)))}
    </div>);
}
//# sourceMappingURL=page.js.map