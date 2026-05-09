# Codava

Strava for coders. Track your coding time per language, project, and file — right in VS Code.

## MVP features

- Status bar shows today's total coding time.
- Idle-aware tracking (pauses after 2 min of inactivity or when the window loses focus).
- Per-language, per-project, per-file breakdowns.
- Today and all-time stat views.
- 100% local — no account, no network.

## Setup

```bash
npm install
npm run compile
```

Open the folder in VS Code and press `F5` to launch an Extension Development Host with Codava loaded.

## Commands

- `Codava: Show Today's Stats`
- `Codava: Show All-Time Stats`

## Roadmap

Backend, social feed, kudos, leaderboards, streaks, multi-editor support. See `CLAUDE.md`.
