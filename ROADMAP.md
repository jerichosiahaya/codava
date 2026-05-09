# Codava Roadmap

Realistic post-dogfood roadmap, oriented around the positioning: **identity > productivity, public profile as the core artifact**.

Assumes part-time work (~10–15 hrs/week). Adjust if going full-time.

---

## Phase 0 — Dogfood week (May 11–15, 2026)

**Goal:** Use Codava personally for 5 working days. No code changes.

- Use the deployed app daily
- Keep a notes file of bugs, frictions, missing features, "huh that's weird"
- Take screenshots when the dashboard looks interesting

**Output:** A real backlog of issues, and a gut check: do *you* still want to use this product?

**Stop condition:** If at the end of the week you don't want to keep using it yourself, kill the project here.

---

## Phase 1 — Triage (May 18–24, 1 week)

**Goal:** Fix what hurt during dogfood. Reset the technical foundation.

- Fix every bug from the dogfood notes
- Wire up `is_write` properly, or drop the column
- Improve language detection if anything was wrong (e.g. `.tsx` showing as `typescriptreact`)
- Tighten extension UX rough edges
- Delete stray `api/src/server.js` and add `api/.gitignore` for `*.js`
- Cancel features you thought you wanted but didn't

**Output:** A version you'd show a friend without disclaimers.

---

## Phase 2 — Make the profile shareable (May 25 – June 14, 3 weeks)

**Goal:** Turn `/u/[username]` into something a developer would link from their Twitter bio.

| Week | Work |
|---|---|
| 1 | Buy `codava.app`. Wire DNS to Vercel + Render. Update OAuth callback URLs. Display GitHub avatar on profile (already have `avatar_url`). |
| 2 | OG image generation — route at `/u/[username]/og` rendering a PNG card with username, avatar, today's time, top language, current streak. Use `@vercel/og`. |
| 3 | Streak counter (consecutive days with activity > 5 min). Display prominently on profile. Add 2–3 tasteful badges: "100h Rust", "30-day streak", "Polyglot" (5+ languages). |

**Why this phase first:** every later phase depends on the profile being a thing people *want* to share. If it's ugly, nobody links to it, and nothing downstream works.

**Output:** A profile URL you'd put in your own Twitter bio.

---

## Phase 3 — Soft alpha (June 15 – June 28, 2 weeks)

**Goal:** ~20 real users, hand-invited (friends, ex-coworkers, Twitter mutuals you trust to give honest feedback).

- Landing page (one screenshot, one CTA) — replace the bare `/signin`
- Privacy policy + Terms of Service (one paragraph each)
- Per-project privacy toggle (default project names public, user can hide specific projects)
- Account deletion flow on web (`DELETE /me` exists, just needs a button)
- VS Code Marketplace listing — icon, README with screenshots, LICENSE, publisher account
- DM 20 specific people. Don't post publicly.
- Sentry (free tier) for error monitoring
- Plausible or Umami for privacy-respecting analytics

**Output:** ~20 users using it for ~2 weeks. Real telemetry. Weekly metrics check.

**Decision point:** Out of ~20 invited users, did ≥5 stay active for 2 weeks?
- **Yes** → continue to Phase 4
- **No** → positioning is wrong, return to Phase 1 with new hypothesis

---

## Phase 4 — Social primitives (July, 4 weeks)

**Goal:** Stop being a tracker. Start being a network. This is where Codava becomes structurally different from WakaTime.

| Week | Work |
|---|---|
| 1 | `follows` table + follow/unfollow buttons on profile |
| 2 | `/feed` page — chronological list of "session" cards from people you follow. Introduce session aggregation: collapse heartbeats with gap < 5 min into a session row (start, end, duration, languages). |
| 3 | Kudos — one-tap orange flame button. Count visible on each session. |
| 4 | Comments on sessions. In-app notifications (no email yet). |

**Discipline:** refuse team features. If a manager asks for "team dashboards", politely decline. That's the wedge.

**Output:** A loop. Sign in → check feed → kudos a friend → friend gets notified → comes back.

---

## Phase 5 — Public launch (August, 2 weeks)

**Goal:** 500–2,000 signups in a week.

- Polish landing page hard. One sentence. One hero image (an OG card of an active profile). One CTA.
- Launch post: HN ("Show HN: Codava — Strava for coders"), dev Twitter, dev.to, indiehackers
- Pick **one** primary platform — where the audience already lives
- 60-second screen-recorded "what is this" video
- Bump Render to paid plan (~$7/mo) — kill cold-start delay before launch traffic

**Decision point:** Sustainable signup flow, or one-day spike?
- **Sustainable** → continue to Phase 6
- **Spike then zero** → wrong distribution channel, try another in 30 days

---

## Phase 6 — Tribe focus (September – November, 12 weeks)

**Goal:** Pick a niche and dominate it before going broad.

Look at the post-launch user base. Which group is over-represented?

- Indie hackers / build-in-public crowd
- OSS contributors
- CS students / bootcamp grads
- Junior devs

Pick one. Ship features that ONLY that group cares about:

- **OSS contributors:** GitHub repo integration, "% of OSS commits" badge
- **Students:** classroom mode, study-group challenges
- **Build-in-public:** auto-generated weekly tweet image of last 7 days
- **Juniors:** "compared to last month" diff cards, learning-streak features

A specific tribe becomes evangelists for a generic product. WakaTime has no tribe — that's an opening.

**Decision point at end of November:** Is there a tribe that loves Codava?
- **Yes** → continue to Phase 7
- **No** → hard pivot or wind down

---

## Phase 7+ — Multi-editor + sustainability (Q1 2027)

Only after Codava is loved by VS Code users:

- JetBrains plugin (large market, paying users)
- Neovim plugin (small but vocal community)
- WakaTime-compatible CLI so users can migrate easily
- Decide monetization:
  - **A.** Free forever, donations only. Honest, slow, OSS-aligned.
  - **B.** Paid power features. Year-over-year history, custom profile domains, advanced badges. Free tier always usable.
  - **C.** Pay-what-you-want with suggested $5/mo. Catches generous users without gating anyone.
  - **NEVER D.** Team plans / employer dashboards. That's WakaTime.

---

## Strategic principles (hold across all phases)

1. **The profile is the product.** Every feature must answer: "does this make `/u/[username]` more shareable / more interesting / more identity-defining?" If no, deprioritize.
2. **Public-first, manager-never.** Refuse team features. The values wedge only works if absolute.
3. **Aesthetic is a feature.** Reject ugly. Linear/Vercel won markets on taste.
4. **Open-source the server, not just the CLI.** WakaTime's closed server is the trust gap to exploit.
5. **Pick a tribe before going broad.** Generic for everyone = compelling for nobody.
6. **No social features until the profile is share-worthy.** Empty feeds kill products.
7. **Monetize last.** Free until the network is real. Paid features only once you'd pay yourself.

---

## Differentiation vs WakaTime

| Dimension | WakaTime | Codava |
|---|---|---|
| Primary customer | Engineering manager | The developer |
| Core artifact | Dashboard | Public profile |
| Brand | Productivity tool | Coder identity / craft |
| Server | Closed-source | Open-source |
| Team plans | Yes | Never |
| Editor breadth | 60+ | VS Code first; expand only on demand |
| Social layer | Token leaderboards | Feed, kudos, comments, follows |

**Positioning line to test:**

> Codava — the coder's public profile. Track your craft. Show your work.

Or sharper:

> Strava for coders. Your code time, public.

Lead with **identity**, not utility.

---

## Total realistic timeline

| Milestone | Date |
|---|---|
| Functional product to ship publicly | mid-August 2026 |
| Product worth charging for | November 2026 |
| Sustainable side project / small business | May 2027 |

The slow part is distribution and tribe-finding, not coding. Most "Strava for X" projects die in Phase 3 because the founder gets bored or the differentiation doesn't land. Codava's advantage is a clear positioning and demonstrated MVP velocity.

---

## Checkpoint summary

| Checkpoint | When | Question | If "no" |
|---|---|---|---|
| End of Phase 0 | May 15 | Did *you* enjoy using it? | Kill the project |
| End of Phase 3 | June 28 | ≥5 of 20 invited users still active after 2 weeks? | Positioning wrong; back to Phase 1 |
| End of Phase 5 | August | Sustainable signup flow after launch? | Wrong distribution; try another in 30 days |
| End of Phase 6 | November | Is there a tribe that loves Codava? | Hard pivot or wind down |
