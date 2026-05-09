import { notFound } from 'next/navigation';
import { fetchPublicProfile, formatDuration } from '../../lib';
import { Heatmap } from '../../Heatmap';

export const dynamic = 'force-dynamic';

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `@${params.username} — Codava` };
}

export default async function PublicProfile({ params }: Props) {
  const data = await fetchPublicProfile(params.username);
  if (!data) notFound();

  const langMax = Math.max(1, ...data.by_language.map((l) => l.seconds));

  return (
    <div className="container">
      <h1>
        <span className="handle">@{data.username}</span>
      </h1>
      <p className="empty">Public profile</p>

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
        <p className="empty">No activity yet.</p>
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
    </div>
  );
}
