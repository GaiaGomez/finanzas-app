# Fynt — Personal Finance Dashboard

[![CI](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/actions/workflows/ci.yml/badge.svg)](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/actions/workflows/ci.yml)

> Monthly budget tracking, debt management, and savings goals in a single SSR-rendered dashboard.
> **[Live Demo →](https://fyntt.vercel.app)**

Built around three constraints: no loading spinners for writes, no client-side waterfall on first load, and user data access enforced entirely at the database layer via Supabase RLS.

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 — App Router, Server Components, `@supabase/ssr` |
| Language | TypeScript 5, strict mode |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS with custom design tokens |
| Fonts | DM Sans + DM Mono, self-hosted via `next/font` |
| PWA | next-pwa — production only; disabled in CI via `DISABLE_PWA=true` |
| Tests | Vitest (unit + integration) · Playwright (E2E) |
| CI | GitHub Actions — lint → test → type-check → build → E2E |
| Deploy | Vercel |
| Node | 20, pinned via `.nvmrc` |

---

## Features

- **Monthly periods** — navigate forward and back; fixed expenses auto-copy to new months
- **Fixed expenses** — categorized recurring costs, paid/unpaid toggle, inline editing
- **Variable expenses** — daily spending log grouped by category
- **Income tracking** — multiple sources per period with descriptions
- **Debt tracker** — total balance, individual payments, payoff progress
- **Savings goals** — set targets, log deposits with notes, view history per goal
- **Summary tab** — income vs. committed vs. spent vs. available; alert thresholds per category
- **Auth** — Magic Link and email/password via Supabase; SSR session handling
- **Optimistic UI** — every write is reflected immediately; silent rollback on error

---

## Architecture

### SSR with no client waterfall

`app/dashboard/page.tsx` is a Server Component. It fires all 7 Supabase queries in a single `Promise.all` before sending HTML — the page arrives fully populated, no loading skeletons on first render.

### Single hook as state layer

All client state, CRUD, and derived values live in `useDashboard`. Components receive typed props only — no intermediate context, no global store. Derived numbers (`gastado`, `disponible`, `pct`, `cats`) are pure functions of the current arrays, recalculated on every render from `lib/finance/calculations.ts`.

### Optimistic updates with snapshot rollback

Every mutation snapshots the current array, applies the change immediately, then awaits the Supabase call. On error, the snapshot is restored and an error string is surfaced to the UI. No mutation library, no spinners.

### RLS as the only auth boundary

There is no server-side API layer. The browser client uses the anon key and talks directly to Supabase. All data access is gated by PostgreSQL Row Level Security — `auth.uid() = user_id` on every table. `abonos` and `abonos_meta` additionally verify that the parent record belongs to the same user on insert.

### `periodo` as a plain string key

All time-scoped tables store `periodo` as `YYYY-MM` text. String comparison is sufficient for filtering, navigation, and auto-copy — no `Date` parsing, no timezone risk.

Full write-up: [docs/architecture.md](docs/architecture.md)

---

## Getting Started

**Prerequisites:** Node 20, a Supabase project.

```bash
git clone https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control.git
cd Fynt_Tu_Dinero_Bajo_Control
nvm use
npm install
```

**Database:** Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. Creates all tables, RLS policies, indexes, and the signup trigger that auto-provisions a user profile. Safe to re-run against an existing project — all statements use `IF NOT EXISTS` or `DROP … IF EXISTS`.

**Environment:**

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

```bash
npm run dev
```

---

## Scripts

| Script | |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (PWA enabled) |
| `DISABLE_PWA=true npm run build` | Build without PWA (used in CI) |
| `npm run lint` | ESLint via `next lint` |
| `npm run type-check` | TypeScript, no emit |
| `npm test` | Vitest — unit + integration, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with v8 coverage report |
| `npm run test:e2e` | Playwright — starts dev server automatically |

---

## Testing

**66 unit/integration tests run in CI alongside a full Playwright E2E suite on Chromium.**

| Layer | File | Tests | What's covered |
|---|---|---|---|
| Unit | `tests/unit/utils.test.ts` | 24 | `fmtCOP`, period helpers, edge cases, round-trip invariants |
| Unit | `tests/unit/calculations.test.ts` | 23 | All finance functions, boundary and empty-array cases |
| Integration | `tests/integration/useDashboard.test.ts` | 19 | Derived values, optimistic update, snapshot rollback |
| E2E | `tests/e2e/dashboard.spec.ts` | CI + local | Navigation, tab routing, empty states, auth flow |

The integration tests mock Supabase with a chainable `PromiseLike` builder that mirrors the SDK's query API, so optimistic update cycles (including rollback) run without a live database.

Full rationale: [docs/testing.md](docs/testing.md)

---

## Security

RLS is enabled on every table. All policies enforce `auth.uid() = user_id` at the database level — not in application code. Both the anon key and Supabase URL are `NEXT_PUBLIC_` because the security model relies on RLS, not on keeping those values secret.

Full policy table: [docs/security.md](docs/security.md)
