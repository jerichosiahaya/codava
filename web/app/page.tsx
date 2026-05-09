import { fetchSummary, formatDuration } from './lib';
import { Heatmap } from './Heatmap';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data;
  try {
    data = await fetchSummary();
  } catch (e) {
    return (
      <div className="container">
        <h1>Codava</h1>
        <p className="empty">API unreachable. Is the server running on {process.env.CODAVA_API_URL}?</p>
      </div>
    );
  }

  const langMax = Math.max(1, ...data.by_language.map((l) => l.seconds));
  const projMax = Math.max(1, ...data.by_project.map((p) => p.seconds));

  return (
    <div className="container">
      <h1>
        <span className="handle">@{data.username}</span>
      </h1>
      <p className="empty">Strava for coders — your coding activity at a glance.</p>

      <div className="stats">
        <div className="stat">
          <div className="label">Today</div>
          <div className="value">{formatDuration(data.today_seconds)}</div>
        </div>
        <div className="stat">
          <div className="label">All time</div>
          <div className="value">{formatDuration(data.total_seconds)}</div>
        </div>
        <div className="stat">
          <div className="label">Active days</div>
          <div className="value">{data.days.length}</div>
        </div>
      </div>

      <h2>Last 6 months</h2>
      {data.days.length === 0 ? (
        <p className="empty">No activity yet. Type some code in VS Code with the extension running.</p>
      ) : (
        <Heatmap days={data.days} />
      )}

      <h2>Languages</h2>
      {data.by_language.length === 0 ? (
        <p className="empty">No data.</p>
      ) : (
        data.by_language.map((l) => (
          <div className="bar-row" key={l.language}>
            <div className="name">{l.language}</div>
            <div className="bar">
              <div style={{ width: `${(l.seconds / langMax) * 100}%` }} />
            </div>
            <div className="val">{formatDuration(l.seconds)}</div>
          </div>
        ))
      )}

      <h2>Projects</h2>
      {data.by_project.length === 0 ? (
        <p className="empty">No data.</p>
      ) : (
        data.by_project.map((p) => (
          <div className="bar-row" key={p.project}>
            <div className="name">{p.project}</div>
            <div className="bar">
              <div style={{ width: `${(p.seconds / projMax) * 100}%` }} />
            </div>
            <div className="val">{formatDuration(p.seconds)}</div>
          </div>
        ))
      )}
    </div>
  );
}
