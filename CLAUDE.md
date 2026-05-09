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

```
src/
  extension.ts   — activation, status bar, command registration
  tracker.ts     — event hooks + idle/focus-aware sampler
  storage.ts     — JSON persistence, day-bucketed aggregation
  stats.ts       — HTML rendering for webview panels
```

No backend, no auth, no network calls. All data stays on disk.

## Build & run

```
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

Commands:
- `Codava: Show Today's Stats`
- `Codava: Show All-Time Stats`

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
