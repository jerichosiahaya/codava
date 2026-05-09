interface Props {
  days: { day: string; seconds: number }[];
}

export function Heatmap({ days }: Props) {
  const map = new Map<string, number>();
  for (const d of days) map.set(d.day.slice(0, 10), d.seconds);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 26 * 7 - today.getDay());

  const max = Math.max(1, ...days.map((d) => d.seconds));
  const cells: { key: string; level: number; title: string }[] = [];
  for (let i = 0; i < 27 * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const sec = map.get(key) ?? 0;
    const pct = sec / max;
    const level = sec === 0 ? 0 : pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : 4;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const dur = sec === 0 ? 'No activity' : h > 0 ? `${h}h ${m}m` : `${m}m`;
    cells.push({ key, level, title: `${key} — ${dur}` });
  }
  return (
    <div className="heatmap">
      {cells.map((c) => (
        <div key={c.key} className={`cell ${c.level > 0 ? `l${c.level}` : ''}`} title={c.title} />
      ))}
    </div>
  );
}
