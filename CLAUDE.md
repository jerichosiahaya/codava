# Codava

"Strava for coders" — a VS Code extension that tracks coding time per language, project, and file. The long-term vision is a social platform (feed, kudos, followers, leaderboards, streaks) layered on top of activity data, modeled after Strava.

## Current scope (MVP — local-only)

- VS Code extension written in TypeScript.
- Tracks active coding time using editor events (`onDidChangeTextDocument`, `onDidChangeActiveTextEditor`, `onDidSaveTextDocument`, `onDidChangeWindowState`).
- Sampling tick runs every 30s; counts time only when:
  - Window is focused, AND
  - User activity occurred within the last 2 minutes (idle timeout).
- Aggregates seconds per day, per language, per project, per file.
- Persists to a single JSON file under VS Code's `globalStorageUri`.
- Status bar shows today's total; commands open webview panels for today / all-time stats.

## Architecture

Monorepo with three independent npm projects under one root:

```
codava/
  src/                 — VS Code extension (TypeScript)
    extension.ts       — activation, status bar, command registration
    tracker.ts         — event hooks + idle/focus-aware sampler
    storage.ts         — local JSON persistence (day-bucketed)
    sync.ts            — batches heartbeats, POSTs to API every 60s, queues offline
    stats.ts           — HTML for in-editor webview panels
  package.json         — extension manifest

  api/                 — Backend (Fastify + Postgres)
    src/
      server.ts        — routes, API-key auth hook
      db.ts            — pg pool + auth helper
      schema.sql       — DB schema + dev seed user
    docker-compose.yml — local Postgres (port 5432)
    package.json

  web/                 — Dashboard (Next.js 14, App Router)
    app/
      page.tsx         — personal dashboard at /
      u/[username]/    — public profile at /u/:username
      Heatmap.tsx      — 6-month calendar grid
      lib.ts           — server-side API fetchers
    package.json
```

Each subfolder has its own `node_modules` and `package.json` — install/build from inside each.

## Build & run

Three services, each from its own folder:

```bash
# Extension (root)
npm install && npm run compile     # then F5 in VS Code

# API (codava/api)
docker compose up -d               # Postgres on :5432
npm install && npm run build && npm start   # API on :4000

# Web (codava/web)
npm install && npm run dev         # dashboard on :3000
```

Dev API key (seeded in `api/src/schema.sql`): `dev-key-jericho-change-me`.
Set it in VS Code settings under `codava.apiKey` to enable cloud sync.

Commands (extension):
- `Codava: Show Today's Stats`
- `Codava: Show All-Time Stats`
- `Codava: Sync Now`

## Future work (not in MVP)

1. Backend ingest API (heartbeats → sessions, similar to Wakapi).
2. User accounts + auth.
3. Social layer: activity feed, kudos, follows, leaderboards.
4. Web dashboard.
5. Cross-editor support (JetBrains, Neovim) via a shared CLI.
6. Achievements / streaks / challenges (Strava "segments" equivalent).

## Conventions

- Keep the tracker logic free of network I/O — the local MVP must work offline.
- Time accounting must be conservative: prefer undercounting (idle/blur) over inflating numbers.
- Day boundaries use local ISO date (`YYYY-MM-DD`) at the moment of the tick.
