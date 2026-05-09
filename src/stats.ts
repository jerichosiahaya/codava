import { DayStats } from './storage';

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function renderTodayHtml(day: DayStats | undefined): string {
  if (!day) return wrap('<h1>Codava — Today</h1><p>No activity recorded yet.</p>');
  return wrap(`
    <h1>Codava — Today (${day.date})</h1>
    <p class="total">Total: <strong>${formatDuration(day.totalSeconds)}</strong></p>
    ${section('Languages', day.byLanguage)}
    ${section('Projects', day.byProject)}
    ${section('Files', day.byFile)}
  `);
}

export function renderAllTimeHtml(all: Record<string, DayStats>): string {
  const days = Object.values(all).sort((a, b) => b.date.localeCompare(a.date));
  const total = days.reduce((sum, d) => sum + d.totalSeconds, 0);
  const langs: Record<string, number> = {};
  const projects: Record<string, number> = {};
  for (const d of days) {
    for (const [k, v] of Object.entries(d.byLanguage)) langs[k] = (langs[k] ?? 0) + v;
    for (const [k, v] of Object.entries(d.byProject)) projects[k] = (projects[k] ?? 0) + v;
  }
  const dayList = days
    .map((d) => `<tr><td>${d.date}</td><td>${formatDuration(d.totalSeconds)}</td></tr>`)
    .join('');
  return wrap(`
    <h1>Codava — All Time</h1>
    <p class="total">Total: <strong>${formatDuration(total)}</strong> across ${days.length} day(s)</p>
    ${section('Languages', langs)}
    ${section('Projects', projects)}
    <h2>By Day</h2>
    <table>${dayList}</table>
  `);
}

function section(title: string, map: Record<string, number>): string {
  const rows = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${escape(k)}</td><td>${formatDuration(v)}</td></tr>`)
    .join('');
  return `<h2>${title}</h2><table>${rows}</table>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: -apple-system, Segoe UI, sans-serif; padding: 1.5rem; }
    h1 { margin-top: 0; }
    .total { font-size: 1.2rem; }
    table { border-collapse: collapse; margin-bottom: 1rem; min-width: 280px; }
    td { padding: 0.3rem 0.8rem; border-bottom: 1px solid #8884; }
    td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  </style></head><body>${body}</body></html>`;
}
